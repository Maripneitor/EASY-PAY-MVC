import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
    User as UserIcon, Mail, Camera, Save, AlertCircle, Phone, 
    Calendar, MapPin, ShieldCheck, X, Building2, CreditCard, Landmark
} from 'lucide-react';
import { PageHeader } from '@ui/components/PageHeader';
import { useAuthContext } from '../../context/AuthContext';
import { userRepository } from '../../../infrastructure/api/repositories';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './PersonalData.module.css';


export const PersonalData = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const { user, updateUserSession } = useAuthContext();

    const [name, setName] = useState(user?.nombre || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [birthDate, setBirthDate] = useState(user?.birthDate || user?.birth_date || '');
    const [address, setAddress] = useState(user?.address || '');
    const [bankAccounts, setBankAccounts] = useState<any[]>(user?.bank_accounts || []);
    const [profileLoading, setProfileLoading] = useState(true);
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Cargar siempre desde la API para tener datos frescos de la BD
    useEffect(() => {
        if (!user?.id) return;
        setProfileLoading(true);
        userRepository.getProfile(user.id)
            .then((profile: any) => {
                if (profile) {
                    setName(profile.nombre || user?.nombre || '');
                    setEmail(profile.email || user?.email || '');
                    setPhone(profile.phone || '');
                    setBirthDate(profile.birth_date || '');
                    setAddress(profile.address || '');
                    setBankAccounts(profile.bank_accounts || []);
                }
            })
            .catch(() => { /* usa los datos del localStorage como fallback */ })
            .finally(() => setProfileLoading(false));
    }, [user?.id]);

    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&bold=true`;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = "El nombre es obligatorio";
        if (name.trim().length < 3) newErrors.name = "El nombre debe tener al menos 3 caracteres";
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) newErrors.email = "El correo es obligatorio";
        else if (!emailRegex.test(email)) newErrors.email = "Formato de correo inválido";

        // Validar cuentas
        bankAccounts.forEach((acc, index) => {
            if (!acc.beneficiario || !acc.clabe || !acc.entidad_financiera) {
                toast.error(`La cuenta ${index + 1} tiene campos incompletos`);
                newErrors[`account_${index}`] = "Incompleto";
            } else if (acc.clabe.length !== 18) {
                toast.error(`La CLABE de la cuenta ${index + 1} debe tener 18 dígitos`);
                newErrors[`account_${index}`] = "CLABE inválida";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!user?.id) return toast.error("Error: Sesión no válida");
        if (!validate()) return;

        setLoading(true);
        const toastId = toast.loading("Guardando cambios...");

        try {
            const result = await userRepository.updateUser(user!.id, {
                nombre: name,
                email: email,
                phone: phone,
                birth_date: birthDate,
                address: address,
                bank_accounts: bankAccounts,
            });

            if (result.status === "success") {
                // Usar el objeto usuario devuelto por el backend que viene completo
                updateUserSession(result.user, result.new_token);

                toast.success("¡Perfil actualizado con éxito!", { id: toastId });
                setTimeout(() => navigate(-1), 1000);
            } else {
                toast.error(result.message || "No se pudo actualizar", { id: toastId });
            }
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const addBankAccount = () => {
        if (bankAccounts.length >= 3) return toast.warning("Máximo 3 cuentas permitidas");
        setBankAccounts([...bankAccounts, { 
            id: Math.random().toString(36).substr(2, 9), 
            beneficiario: name, 
            clabe: '', 
            entidad_financiera: '',
            is_default: bankAccounts.length === 0
        }]);
    };

    const removeBankAccount = (id: string) => {
        setBankAccounts(bankAccounts.filter(a => a.id !== id));
    };

    const updateBankAccount = (id: string, field: string, value: string) => {
        setBankAccounts(bankAccounts.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    return (
        <div className={`${styles.container} no-scrollbar overflow-y-auto`}>
            <PageHeader
                title="DATOS PERSONALES"
                subtitle="Editar Perfil"
                onBack={() => navigate(-1)}
                onMenuClick={toggleSidebar}
                showAvatar={false}
            />

            <main className={styles.mainContent}>
                <div className={styles.glow} />

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.contentWrapper}
                >
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper}>
                            <motion.img 
                                key={name}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                src={avatar} 
                                alt="Profile" 
                                className={styles.avatar} 
                            />
                            <button className={styles.cameraBtn}>
                                <Camera size={20} />
                            </button>
                        </div>
                    </div>

                    <div className={`${styles.formSection} grid grid-cols-1 md:grid-cols-2 gap-6`}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <UserIcon size={18} className={styles.icon} />
                                Nombre Completo
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`${styles.input} ${errors.name ? 'border-rose-500 ring-rose-500/20' : ''}`}
                                    placeholder="Escribe tu nombre"
                                />
                                <AnimatePresence>
                                    {errors.name && (
                                        <motion.span 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute -bottom-5 left-0 text-[10px] text-rose-500 font-bold uppercase tracking-wider flex items-center gap-1"
                                        >
                                            <AlertCircle size={10} /> {errors.name}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <Mail size={18} className={styles.icon} />
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`${styles.input} ${errors.email ? 'border-rose-500 ring-rose-500/20' : ''}`}
                                    placeholder="tu@correo.com"
                                />
                                <AnimatePresence>
                                    {errors.email && (
                                        <motion.span 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute -bottom-5 left-0 text-[10px] text-rose-500 font-bold uppercase tracking-wider flex items-center gap-1"
                                        >
                                            <AlertCircle size={10} /> {errors.email}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <Phone size={18} className={styles.icon} />
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={styles.input}
                                placeholder="+52 ..."
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <Calendar size={18} className={styles.icon} />
                                Fecha de Nacimiento
                            </label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className={styles.input}
                            />
                        </div>

                        <div className={`${styles.inputGroup} md:col-span-2`}>
                            <label className={styles.label}>
                                <MapPin size={18} className={styles.icon} />
                                Dirección
                            </label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className={styles.input}
                                placeholder="Calle, Número, Ciudad..."
                            />
                        </div>
                    </div>
                    
                    <div className="mt-12">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-[3px] text-[var(--text-secondary)]">Cuentas Bancarias ({bankAccounts.length}/3)</h3>
                            <button 
                                onClick={addBankAccount}
                                disabled={bankAccounts.length >= 3}
                                className="px-4 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-black uppercase rounded-full hover:bg-[var(--primary)]/20 transition-colors disabled:opacity-30"
                            >
                                Añadir Cuenta
                            </button>
                        </div>

                        <div className="space-y-6">
                            {bankAccounts.length === 0 ? (
                                <div className="p-10 border-2 border-dashed border-[var(--border-color)] rounded-[2rem] flex flex-col items-center justify-center opacity-40">
                                    <Landmark size={40} className="mb-4" />
                                    <p className="text-xs font-bold">No has registrado cuentas para recibir pagos</p>
                                </div>
                            ) : (
                                bankAccounts.map((acc, index) => (
                                    <motion.div 
                                        key={acc.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] relative group"
                                    >
                                        <button 
                                            onClick={() => removeBankAccount(acc.id)}
                                            className="absolute top-6 right-6 p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                                        >
                                            <X size={20} />
                                        </button>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Banco</label>
                                                <input
                                                    type="text"
                                                    value={acc.entidad_financiera}
                                                    onChange={(e) => updateBankAccount(acc.id, 'entidad_financiera', e.target.value)}
                                                    className={styles.input}
                                                    placeholder="Ej. BBVA"
                                                />
                                            </div>
                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>CLABE (18 dígitos)</label>
                                                <input
                                                    type="text"
                                                    value={acc.clabe}
                                                    onChange={(e) => updateBankAccount(acc.id, 'clabe', e.target.value)}
                                                    className={`${styles.input} font-mono`}
                                                    maxLength={18}
                                                    placeholder="000..."
                                                />
                                            </div>
                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Beneficiario</label>
                                                <input
                                                    type="text"
                                                    value={acc.beneficiario}
                                                    onChange={(e) => updateBankAccount(acc.id, 'beneficiario', e.target.value)}
                                                    className={styles.input}
                                                    placeholder="Nombre titular"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="pt-12">
                        <button
                            className={styles.saveBtn}
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save size={20} />
                                    Guardar Cambios
                                </div>
                            )}
                        </button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};