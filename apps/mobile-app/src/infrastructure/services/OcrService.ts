import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const OCR_API_KEY = 'K88694858788957';

export interface TicketItem {
    name: string;
    price: number;
    quantity: number;
}

export interface TicketData {
    restaurantName: string;
    items: TicketItem[];
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    rawText: string;
}

class OcrService {

    static async pickFromCamera(): Promise<string | null> {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') throw new Error('Se necesita permiso para usar la cámara.');
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.9,
            allowsEditing: false,
        });
        if (result.canceled) return null;
        return result.assets[0].uri;
    }

    static async pickFromGallery(): Promise<string | null> {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') throw new Error('Se necesita permiso para acceder a la galería.');
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.9,
            allowsEditing: false,
        });
        if (result.canceled) return null;
        return result.assets[0].uri;
    }

    static async compressImage(uri: string): Promise<string> {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1400 } }],
            { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        return result.base64 ?? '';
    }

    static async extractText(imageUri: string): Promise<string> {
        const base64 = await this.compressImage(imageUri);
        const formData = new FormData();
        formData.append('base64Image', `data:image/jpeg;base64,${base64}`);
        formData.append('language', 'spa');
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('isTable', 'true');
        formData.append('OCREngine', '2');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                headers: { apikey: OCR_API_KEY },
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const data = await response.json();
            return data?.ParsedResults?.[0]?.ParsedText ?? '';
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('La conexión con el servicio de OCR expiró. Revisa tu internet e intenta de nuevo.');
            }
            throw error;
        }
    }

    static parseTicketText(rawText: string): TicketData {
        const lines = rawText
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0);

        // ── Detectar nombre del restaurante ──────────────────────────────────────
        // Busca las primeras líneas que no sean metadatos
        const metaPatterns = /folio|orden|order|fecha|date|hora|time|cajero|mesero|ticket|mesa|persons?|\d{2}\/\d{2}|\d{2}:\d{2}/i;
        let restaurantName = 'Restaurante';
        for (const line of lines.slice(0, 8)) {
            if (!metaPatterns.test(line) && line.length >= 3 && !/^\d+$/.test(line)) {
                restaurantName = this.titleCase(line);
                break;
            }
        }

        // ── Palabras a ignorar (no son items) ────────────────────────────────────
       const skipLine = /total|subtotal|sub\s*total|iva|impuesto|propina|tip|descuento|discount|cambio|efectivo|tarjeta|pago|gracias|thank|folio|orden|cajero|mesero|fecha|hora|son:|this is not|este no es|comprobante|fiscal|rfc|direcci|tel[ef]|whatsapp|facebook|instagram|www\.|\.com|wow!|muy bien|\d+%|si requiere|facturaci|soft restaurant|cant\.|descripcion|importe/i;

        // ── Parsear items del ticket ──────────────────────────────────────────────
        // Patrones de tickets mexicanos:
        // "1 PEPSI $39.00"
        // "PEPSI              39.00"
        // "1  MARTES DE BONELESS 2   64.50"
        // "NARANJADA 450 ML          39.00"
        const items: TicketItem[] = [];

        for (const line of lines) {
            if (skipLine.test(line)) continue;

            // Patrón 1: cantidad al inicio + nombre + precio al final
            // Ej: "1 PEPSI 39.00" o "2 TACOS AL PASTOR 58.00"
            const p1 = line.match(/^(\d{1,2})\s+(.{2,40}?)\s+\$?([\d,]+\.?\d{0,2})$/);
            if (p1) {
                const qty = parseInt(p1[1]);
                const name = this.cleanItemName(p1[2]);
                const price = parseFloat(p1[3].replace(',', ''));
                if (qty <= 20 && price > 0 && price < 99999 && name.length > 1) {
                    items.push({ name, price, quantity: qty });
                    continue;
                }
            }

            // Patrón 2: nombre + precio al final (sin cantidad)
            // Ej: "PEPSI                    39.00"
            const p2 = line.match(/^(.{2,45}?)\s{2,}\$?([\d,]+\.?\d{0,2})$/);
            if (p2) {
                const name = this.cleanItemName(p2[1]);
                const price = parseFloat(p2[2].replace(',', ''));
                if (price > 0 && price < 99999 && name.length > 1 && !/^\d+$/.test(name)) {
                    items.push({ name, price, quantity: 1 });
                    continue;
                }
            }

            // Patrón 3: precio con $ pegado al nombre
            // Ej: "PEPSI $39.00"
            const p3 = line.match(/^(.{2,40}?)\s+\$([\d,]+\.?\d{0,2})$/);
            if (p3) {
                const name = this.cleanItemName(p3[1]);
                const price = parseFloat(p3[2].replace(',', ''));
                if (price > 0 && price < 99999 && name.length > 1) {
                    items.push({ name, price, quantity: 1 });
                }
            }
        }

        // ── Detectar totales ──────────────────────────────────────────────────────
        let total = 0, subtotal = 0, tax = 0, tip = 0;

        for (const line of lines) {
            // Extrae el último número de la línea
            const nums = line.match(/\$?([\d,]+\.\d{2})/g);
            const lastNum = nums ? parseFloat(nums[nums.length - 1].replace(/[$,]/g, '')) : 0;

            if (/^total/i.test(line) && lastNum > 0) total = lastNum;
            else if (/subtotal/i.test(line)) {
                // Formato "SUBTOTAL:$267.67  IVA:$42.82" en una sola línea
                const subMatch = line.match(/subtotal[:\s]*\$?([\d,]+\.?\d{0,2})/i);
                const ivaMatch = line.match(/iva[:\s]*\$?([\d,]+\.?\d{0,2})/i);
                if (subMatch) subtotal = parseFloat(subMatch[1].replace(',',''));
                if (ivaMatch) tax = parseFloat(ivaMatch[1].replace(',',''));
            } else if (/^iva|^impuesto/i.test(line) && lastNum > 0) tax = lastNum;
        }

        // Si no detectó total, suma los items
        if (total === 0 && items.length > 0) {
            total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
            total = Math.round(total * 100) / 100;
        }

        // Si no detectó subtotal, calcularlo
        if (subtotal === 0 && total > 0 && tax > 0) {
            subtotal = Math.round((total - tax) * 100) / 100;
        }

        return { restaurantName, items, subtotal, tax, tip, total, rawText };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────────

    private static cleanItemName(raw: string): string {
        return raw
            .replace(/^\d+\s+/, '')      // quitar cantidad al inicio
            .replace(/\s{2,}/g, ' ')      // espacios múltiples
            .replace(/[*#|]/g, '')        // caracteres raros
            .trim();
    }

    private static titleCase(str: string): string {
        return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }

    static async extractTicketData(imageUri: string): Promise<TicketData> {
        const text = await this.extractText(imageUri);
        if (!text || text.trim().length < 10) {
            throw new Error('No se pudo leer el ticket. Intenta con mejor iluminación.');
        }
        return this.parseTicketText(text);
    }
}

export default OcrService;
