import React, { useState, useEffect } from 'react';
import {
    Clock,
    Users,
    History,
    Plus,
    Calendar,
    ArrowRightLeft,
    ChevronRight,
    Briefcase,
    GraduationCap,
    Contact,
    X,
    FileDown,
    Trash2,
    LogOut
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Utils
const formatDisplayTime = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return format(date, 'HH:mm');
    }
    // Fallback para formatos muito específicos ou corrompidos
    const parts = timestamp.split(/[\sT]/);
    const timePart = parts.length > 1 ? parts[1] : (timestamp.includes(':') ? timestamp : "");
    return timePart.substring(0, 5);
};

// Components
const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${active
            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
            : 'text-slate-500 hover:bg-slate-100'
            }`}
    >
        <Icon size={20} />
        <span className="font-medium text-sm">{label}</span>
    </button>
);

const PunchCard = () => {
    const [time, setTime] = useState(new Date());
    const [registrationId, setRegistrationId] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [employeeStatus, setEmployeeStatus] = useState<{ lastType: string | null, employeeName: string, lastTimestamp: string | null, dailyHours: number | null } | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const checkStatus = async () => {
            if (registrationId.length >= 3) {
                try {
                    const response = await fetch(`http://localhost:3001/api/check-punch/${registrationId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setEmployeeStatus(data);
                        setMessage(null);
                    } else if (response.status === 403) {
                        const data = await response.json();
                        setEmployeeStatus(null);
                        setMessage({ type: 'error', text: data.error });
                    } else {
                        setEmployeeStatus(null);
                    }
                } catch (err) {
                    setEmployeeStatus(null);
                }
            } else {
                setEmployeeStatus(null);
            }
        };

        const timeoutId = setTimeout(checkStatus, 500);
        return () => clearTimeout(timeoutId);
    }, [registrationId]);

    const handlePunch = async (type: 'IN' | 'OUT') => {
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('http://localhost:3001/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrationId, type })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao registrar ponto');
            }

            setMessage({ type: 'success', text: `${data.message} (${data.employeeName})` });
            setRegistrationId('');
            setEmployeeStatus(null);

            setTimeout(() => setMessage(null), 5000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card max-w-2xl mx-auto border-2 border-slate-200 shadow-2xl shadow-slate-200/40 relative overflow-hidden bg-slate-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16 opacity-50" />
            <div className="relative z-10 flex flex-col items-center py-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                    Horário de Brasília
                </div>

                <h1 className="text-7xl font-bold text-slate-900 font-mono tracking-tight mb-2">
                    {format(time, 'HH:mm:ss')}
                </h1>
                <p className="text-slate-500 text-lg mb-8 capitalize">
                    {format(time, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>

                <div className="w-full max-w-sm mb-10 space-y-4 text-center">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] text-center block">Número da Matrícula</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors">
                                <Contact size={22} />
                            </div>
                            <input
                                value={registrationId}
                                autoFocus
                                onChange={e => setRegistrationId(e.target.value)}
                                type="text"
                                placeholder="Digite sua matrícula"
                                className="w-full pl-14 pr-4 py-5 bg-white border-[3px] border-rose-300 rounded-3xl focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 shadow-[0_0_40px_-10px_rgba(244,63,94,0.3)] hover:shadow-[0_0_50px_-5px_rgba(244,63,94,0.4)] focus:shadow-[0_0_50px_-5px_rgba(244,63,94,0.5)] transition-all text-center text-2xl font-black tracking-[0.15em] text-slate-900 placeholder:text-base placeholder:font-medium placeholder:text-slate-300 placeholder:tracking-normal"
                            />
                        </div>
                    </div>

                    {employeeStatus && (
                        <div className="animate-in fade-in duration-300">
                            <p className="text-xl font-black text-slate-900 tracking-tight">
                                Olá, <span className="text-rose-600">{employeeStatus.employeeName}</span>!
                            </p>
                        </div>
                    )}

                    {message && (
                        <div className={`p-4 rounded-xl text-sm font-medium border animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success'
                            ? 'bg-green-50 text-green-700 border-green-100'
                            : message.type === 'error'
                                ? 'bg-red-50 text-red-600 border-red-100'
                                : 'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                            {message.text}
                        </div>
                    )}
                </div>

                <div className="w-full max-w-sm">
                    <div className="grid grid-cols-2 gap-4 items-start">
                        <button
                            onClick={() => handlePunch('IN')}
                            disabled={loading || !employeeStatus || employeeStatus.lastType === 'IN'}
                            className={`group w-full flex flex-col items-center justify-center p-6 bg-white border-2 rounded-3xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${employeeStatus?.lastType !== 'IN' && employeeStatus
                                ? "border-green-500 shadow-2xl shadow-green-500/20 scale-105"
                                : "border-slate-200 grayscale-[0.5]"
                                }`}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${employeeStatus?.lastType !== 'IN' && employeeStatus
                                ? "bg-green-600 text-white shadow-lg shadow-green-500/30"
                                : "bg-slate-50 text-slate-400"
                                }`}>
                                <Plus size={32} />
                            </div>
                            <span className={`text-lg font-black tracking-tight ${employeeStatus?.lastType !== 'IN' && employeeStatus ? "text-slate-800" : "text-slate-400"
                                }`}>Entrada</span>
                        </button>

                        <button
                            onClick={() => handlePunch('OUT')}
                            disabled={loading || !employeeStatus || employeeStatus.lastType !== 'IN'}
                            className={`group w-full flex flex-col items-center justify-center p-6 bg-white border-2 rounded-3xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${employeeStatus?.lastType === 'IN'
                                ? "border-rose-500 shadow-2xl shadow-rose-500/20 scale-105"
                                : "border-slate-200 grayscale-[0.5]"
                                }`}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${employeeStatus?.lastType === 'IN'
                                ? "bg-rose-600 text-white shadow-lg shadow-rose-500/30"
                                : "bg-slate-50 text-slate-400"
                                }`}>
                                <ArrowRightLeft size={32} className="rotate-90" />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className={`text-lg font-black tracking-tight ${employeeStatus?.lastType === 'IN' ? "text-slate-800" : "text-slate-400"
                                    }`}>Saída</span>
                                {employeeStatus?.lastType === 'IN' && employeeStatus.lastTimestamp && (
                                    <>
                                        <div className="w-12 h-[2px] bg-slate-200 my-2 rounded-full" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                            Entrou às <span className="text-slate-900 font-mono text-sm">{formatDisplayTime(employeeStatus.lastTimestamp)}</span>
                                        </span>
                                    </>
                                )}
                            </div>
                        </button>
                    </div>

                    {!employeeStatus && registrationId.length >= 3 && (
                        <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest animate-pulse">
                            Aguardando identificação...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};



const EmployeeModal = ({ onClose, onSave, editingEmployee }: any) => {
    const [formData, setFormData] = useState({
        name: editingEmployee?.name || '',
        course: editingEmployee?.course || '',
        registrationId: editingEmployee?.registrationId || '',
        workScheduleId: editingEmployee?.workScheduleId || '',
        status: editingEmployee?.status || 'ACTIVE',
        defaultEntryTime: editingEmployee?.defaultEntryTime || '08:00',
        defaultExitTime: editingEmployee?.defaultExitTime || '12:00'
    });
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('http://localhost:3001/api/schedules')
            .then(res => res.json())
            .then(data => {
                setSchedules(data);
                if (data.length > 0 && !editingEmployee) {
                    setFormData(prev => ({ ...prev, workScheduleId: data[0].id }));
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Erro ao carregar jornadas');
                setLoading(false);
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const url = editingEmployee
                ? `http://localhost:3001/api/employees/${editingEmployee.id}`
                : 'http://localhost:3001/api/employees';

            const response = await fetch(url, {
                method: editingEmployee ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Erro ao ${editingEmployee ? 'atualizar' : 'cadastrar'} funcionário`);
            }

            onSave();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800">
                        {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Users size={18} />
                            </div>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                type="text"
                                placeholder="Ex: João da Silva"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Matrícula</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Contact size={18} />
                                </div>
                                <input
                                    required
                                    value={formData.registrationId}
                                    onChange={e => setFormData({ ...formData, registrationId: e.target.value })}
                                    type="text"
                                    placeholder="ID001"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm hover:shadow-md"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Curso</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <GraduationCap size={18} />
                                </div>
                                <input
                                    required
                                    value={formData.course}
                                    onChange={e => setFormData({ ...formData, course: e.target.value })}
                                    type="text"
                                    placeholder="Ex: Análise e Desenv. de Sistemas"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Jornada de Trabalho</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Briefcase size={18} />
                            </div>
                            <select
                                required
                                value={formData.workScheduleId}
                                onChange={e => setFormData({ ...formData, workScheduleId: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none"
                            >
                                <option value="" disabled>Selecione uma jornada</option>
                                {schedules.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.dailyHours}h/dia)</option>
                                ))}
                            </select>
                            {schedules.length === 0 && !loading && (
                                <p className="text-[10px] text-amber-600 mt-1 font-medium">
                                    Nenhuma jornada cadastrada.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Entrada Padrão</label>
                            <input
                                required
                                value={formData.defaultEntryTime}
                                onChange={e => setFormData({ ...formData, defaultEntryTime: e.target.value })}
                                type="time"
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Saída Padrão</label>
                            <input
                                required
                                value={formData.defaultExitTime}
                                onChange={e => setFormData({ ...formData, defaultExitTime: e.target.value })}
                                type="time"
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Status do Estagiário</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none"
                        >
                            <option value="ACTIVE">Ativo (Acesso Liberado)</option>
                            <option value="INACTIVE">Inativo (Acesso Bloqueado)</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || schedules.length === 0}
                            className="flex-1 px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
                        >
                            {editingEmployee ? 'Salvar Alterações' : 'Salvar Funcionário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchEmployees = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/employees');
            const data = await response.json();
            setEmployees(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            console.error('Error fetching employees:', error);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };




    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleDeleteEmployee = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este estagiário? Todos os registros de ponto vinculados também serão apagados.')) return;

        try {
            const response = await fetch(`http://localhost:3001/api/employees/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao excluir estagiário');
            }

            fetchEmployees();
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Funcionários</h2>
                    <p className="text-slate-500 text-sm">Gerencie os colaboradores da empresa</p>
                </div>
                <button
                    onClick={() => {
                        setEditingEmployee(null);
                        setShowModal(true);
                    }}
                    className="btn-primary w-full md:w-auto"
                >
                    <Plus size={18} />
                    Novo Funcionário
                </button>
            </div>

            <div className="card overflow-hidden !p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Funcionário</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Matrícula</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Curso</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Jornada</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Carregando...</td></tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-2">
                                                <Users size={32} />
                                            </div>
                                            <p className="font-bold text-slate-800">Nenhum funcionário cadastrado</p>
                                            <p className="text-sm text-slate-500">Comece adicionando seu primeiro colaborador</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : employees.map((emp: any) => (
                                <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                                                {emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                            </div>
                                            <span className="font-bold text-slate-800">{emp.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm font-mono">{emp.registrationId}</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm font-medium">{emp.course}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                                            {emp.workSchedule?.name || 'Não informada'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${emp.status === 'ACTIVE'
                                            ? 'bg-green-50 text-green-600 border border-green-100'
                                            : 'bg-rose-50 text-rose-600 border border-rose-100 opacity-60'
                                            }`}>
                                            {emp.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingEmployee(emp);
                                                    setShowModal(true);
                                                }}
                                                className="text-slate-400 hover:text-brand-600 transition-colors p-2 hover:bg-brand-50 rounded-lg"
                                                title="Editar"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEmployee(emp.id)}
                                                className="text-slate-400 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded-lg"
                                                title="Excluir"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <EmployeeModal
                    editingEmployee={editingEmployee}
                    onClose={() => {
                        setShowModal(false);
                        setEditingEmployee(null);
                    }}
                    onSave={() => {
                        setShowModal(false);
                        setEditingEmployee(null);
                        fetchEmployees();
                    }}
                />
            )}
        </div>
    );
};

const ScheduleModal = ({ onClose, onSave, editingSchedule }: any) => {
    const [formData, setFormData] = useState({
        name: editingSchedule?.name || '',
        dailyHours: editingSchedule?.dailyHours || 8,
        weeklyHours: editingSchedule?.weeklyHours || 40
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const url = editingSchedule
                ? `http://localhost:3001/api/schedules/${editingSchedule.id}`
                : 'http://localhost:3001/api/schedules';

            const response = await fetch(url, {
                method: editingSchedule ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    dailyHours: Number(formData.dailyHours),
                    weeklyHours: Number(formData.weeklyHours)
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Erro ao ${editingSchedule ? 'atualizar' : 'cadastrar'} jornada`);
            }

            onSave();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800">
                        {editingSchedule ? 'Editar Jornada' : 'Nova Jornada'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Nome da Jornada</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Briefcase size={18} />
                            </div>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                type="text"
                                placeholder="Ex: Comercial 08-18"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Horas Diárias</label>
                            <input
                                required
                                value={formData.dailyHours}
                                onChange={e => setFormData({ ...formData, dailyHours: Number(e.target.value) })}
                                type="number"
                                step="0.5"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Horas Semanais</label>
                            <input
                                required
                                value={formData.weeklyHours}
                                onChange={e => setFormData({ ...formData, weeklyHours: Number(e.target.value) })}
                                type="number"
                                step="0.5"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : editingSchedule ? 'Salvar Alterações' : 'Salvar Jornada'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const HolidayModal = ({ onClose, onSave, editingHoliday }: any) => {
    const [formData, setFormData] = useState({
        name: editingHoliday?.name || '',
        day: editingHoliday?.day || '',
        month: editingHoliday?.month || '',
        year: editingHoliday?.year || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await onSave(formData);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800">
                        {editingHoliday ? 'Editar Feriado' : 'Novo Feriado'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Nome do Feriado</label>
                        <input
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            type="text"
                            placeholder="Ex: Natal, Proclamação da República"
                            className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all placeholder:text-slate-400 font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Dia</label>
                            <input
                                required
                                value={formData.day}
                                onChange={e => setFormData({ ...formData, day: e.target.value })}
                                type="number"
                                min="1"
                                max="31"
                                className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Mês</label>
                            <select
                                required
                                value={formData.month}
                                onChange={e => setFormData({ ...formData, month: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all cursor-pointer font-medium"
                            >
                                <option value="">Selecione...</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                    <option key={m} value={m}>{format(new Date(2024, m - 1, 1), "MMMM", { locale: ptBR })}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Ano (Opcional)</label>
                            <input
                                value={formData.year}
                                onChange={e => setFormData({ ...formData, year: e.target.value })}
                                type="number"
                                placeholder="Recorrente"
                                className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all placeholder:text-slate-400 font-medium"
                            />
                            <p className="text-[10px] text-slate-400 px-1 mt-1 leading-tight">Deixe vazio para feriados que repetem todo ano.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : editingHoliday ? 'Salvar Alterações' : 'Salvar Feriado'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const isDateHoliday = (date: Date, holidays: any[]) => {
    return holidays.find(h => 
        h.day === date.getDate() && 
        h.month === (date.getMonth() + 1) && 
        (!h.year || h.year === date.getFullYear())
    );
};

const Holidays = ({ holidays, fetchHolidays }: { holidays: any[], fetchHolidays: () => void }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<any>(null);

    const handleSave = async (formData: any) => {
        const url = editingHoliday 
            ? `http://localhost:3001/api/holidays/${editingHoliday.id}`
            : 'http://localhost:3001/api/holidays';
        
        const response = await fetch(url, {
            method: editingHoliday ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Erro ao salvar feriado');
        fetchHolidays();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este feriado?')) return;
        const response = await fetch(`http://localhost:3001/api/holidays/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) fetchHolidays();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Feriados</h2>
                    <p className="text-slate-500 mt-1">Configure os dias de folga oficiais que valem para todos os funcionários.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingHoliday(null);
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                >
                    <Plus size={20} />
                    Novo Feriado
                </button>
            </div>

            <div className="card overflow-hidden !p-0 border-none shadow-2xl shadow-slate-200/50 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Nome do Feriado</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Data</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {holidays.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Calendar size={48} className="text-slate-200 mb-2" />
                                            <p className="font-black text-slate-800">Nenhum feriado cadastrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                holidays.map((h: any) => (
                                    <tr key={h.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                                                    <Calendar size={20} />
                                                </div>
                                                <span className="font-bold text-slate-800">{h.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-black tracking-widest">
                                                {String(h.day).padStart(2, '0')}/{String(h.month).padStart(2, '0')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            {h.year ? (
                                                <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-xs font-black uppercase tracking-widest">
                                                    Ano: {h.year}
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase tracking-widest">
                                                    Recorrente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingHoliday(h);
                                                        setShowModal(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                                                    title="Editar"
                                                >
                                                    <History size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(h.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <HolidayModal
                    editingHoliday={editingHoliday}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

const Schedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchSchedules = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/schedules');
            const data = await response.json();
            setSchedules(data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta jornada?')) return;

        try {
            const response = await fetch(`http://localhost:3001/api/schedules/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao excluir jornada');
            }

            fetchSchedules();
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Jornadas de Trabalho</h2>
                    <p className="text-slate-500 text-sm">Defina os horários e escalas dos funcionários</p>
                </div>
                <button
                    onClick={() => {
                        setEditingSchedule(null);
                        setShowModal(true);
                    }}
                    className="btn-primary w-full md:w-auto"
                >
                    <Plus size={18} />
                    Nova Jornada
                </button>
            </div>

            <div className="card overflow-hidden !p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nome da Jornada</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Carga Diária</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Carga Semanal</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Carregando...</td></tr>
                            ) : schedules.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-2">
                                                <Briefcase size={32} />
                                            </div>
                                            <p className="font-bold text-slate-800">Nenhuma jornada cadastrada</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : schedules.map((s: any) => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{s.dailyHours}h</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{s.weeklyHours}h</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingSchedule(s);
                                                    setShowModal(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <ArrowRightLeft size={18} className="rotate-90" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(s.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Excluir"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <ScheduleModal
                    editingSchedule={editingSchedule}
                    onClose={() => {
                        setShowModal(false);
                        setEditingSchedule(null);
                    }}
                    onSave={() => {
                        setShowModal(false);
                        setEditingSchedule(null);
                        fetchSchedules();
                    }}
                />
            )}
        </div>
    );
};

const HistoryView = ({ isAdmin = false, holidays }: { isAdmin?: boolean, holidays: any[] }) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [employees, setEmployees] = useState<{ id: string, name: string, course: string, registrationId: string, status?: string, defaultEntryTime?: string, defaultExitTime?: string, workSchedule?: any }[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [availableMonths, setAvailableMonths] = useState<{ month: number, year: number }[]>([]);
    const [editingInEntry, setEditingInEntry] = useState<any>(null);
    const [editingOutEntry, setEditingOutEntry] = useState<any>(null);
    const [isAdding, setIsAdding] = useState<any>(null); // Stores the date {date, employeeId}
    const [editTimeIn, setEditTimeIn] = useState('');
    const [editTimeOut, setEditTimeOut] = useState('');

    const [justifications, setJustifications] = useState<any[]>([]);
    const [modalMode, setModalMode] = useState<'REGISTRO' | 'JUSTIFICATIVA'>('REGISTRO');
    const [justificationType, setJustificationType] = useState('EMENDA');
    const [justificationDesc, setJustificationDesc] = useState('');
    const [historyRegistrationId, setHistoryRegistrationId] = useState('');
    const [historyError, setHistoryError] = useState('');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, punchId: string | null } | null>(null);

    const [showPDFModal, setShowPDFModal] = useState(false);
    const [selectedPDFMonths, setSelectedPDFMonths] = useState<{ month: number, year: number }[]>([]);

    const [inlineEditId, setInlineEditId] = useState<string | null>(null);
    const [inlineEditTime, setInlineEditTime] = useState("");

    const handleDeleteSinglePunch = async (id: string) => {
        if (!confirm("Deseja realmente excluir este registro?")) return;
        try {
            const response = await fetch(`http://localhost:3001/api/time-entries/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchHistory();
            } else {
                alert("Erro ao excluir registro");
            }
        } catch (err) {
            console.error("Erro ao excluir:", err);
            alert("Erro na conexão com o servidor");
        }
    };

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchEmployees = async () => {
        try {
            const employeesRes = await fetch('http://localhost:3001/api/employees');
            const employeesData = await employeesRes.json();
            setEmployees(employeesData);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchAvailableMonths = async () => {
        if (!selectedEmployeeId) return;
        try {
            const res = await fetch(`http://localhost:3001/api/history/months?employeeId=${selectedEmployeeId}`);
            const data = await res.json();
            
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            
            // Determinar o semestre atual (1: Jan-Jun, 2: Jul-Dez)
            const currentSemester = currentMonth <= 6 ? 1 : 2;
            
            // Criar lista baseada nos dados do banco
            let combined = [...data];
            
            // Adicionar TODOS os meses do semestre atual automaticamente
            const semesterMonths = currentSemester === 1 
                ? [1, 2, 3, 4, 5, 6] 
                : [7, 8, 9, 10, 11, 12];
                
            semesterMonths.forEach(m => {
                const alreadyExists = combined.some(item => item.month === m && item.year === currentYear);
                if (!alreadyExists) {
                    combined.push({ month: m, year: currentYear });
                }
            });

            // Ordenar por ano e mês (mais recentes primeiro)
            combined.sort((a, b) => b.year - a.year || b.month - a.month);
            
            setAvailableMonths(combined);

            // Ajustar seleção inicial: se o mês atual estiver na lista, seleciona ele
            const alreadySelectedExist = combined.find((d: any) => d.month === selectedMonth && d.year === selectedYear);
            if (!alreadySelectedExist) {
                const currentInList = combined.find(m => m.month === currentMonth && m.year === currentYear);
                if (currentInList) {
                    setSelectedMonth(currentMonth);
                    setSelectedYear(currentYear);
                } else if (combined.length > 0) {
                    setSelectedMonth(combined[0].month);
                    setSelectedYear(combined[0].year);
                }
            }
        } catch (error) {
            console.error('Error fetching available months:', error);
        }
    };

    const fetchHistory = async () => {
        if (!selectedEmployeeId) return;
        setLoading(true);
        try {
            const [historyRes, justificationsRes] = await Promise.all([
                fetch(`http://localhost:3001/api/history?employeeId=${selectedEmployeeId}`),
                fetch(`http://localhost:3001/api/justifications?employeeId=${selectedEmployeeId}`)
            ]);
            
            const historyData = await historyRes.json();
            const justificationsData = await justificationsRes.json();
            
            setEntries(Array.isArray(historyData) ? historyData : []);
            setJustifications(Array.isArray(justificationsData) ? justificationsData : []);
        } catch (error) {
            console.error('Error fetching history/justifications:', error);
        } finally {
            setLoading(false);
        }
    };



    const toggleJustification = async (date: string, type: string, description: string = '') => {
        const dateEntries = entries.filter(e => format(new Date(e.timestamp), "yyyy-MM-dd") === date);
        const existingJ = justifications.find(j => format(new Date(j.date), "yyyy-MM-dd") === date);
        
        // Se estamos adicionando ou alterando uma justificativa e existem entradas de ponto
        const isRemoving = existingJ && existingJ.type === type && (existingJ.description || '') === description;

        if (!isRemoving && dateEntries.length > 0) {
            const confirmRemove = window.confirm("Atenção: Existem horários registrados para este dia. Deseja remover definitivamente estes registros para aplicar a justificativa? Se cancelar, os horários serão mantidos e a justificativa não será aplicada.");
            if (!confirmRemove) return;

            try {
                await Promise.all(dateEntries.map(e => 
                    fetch(`http://localhost:3001/api/time-entries/${e.id}`, { method: 'DELETE' })
                ));
            } catch (err) {
                console.error("Erro ao remover horários:", err);
                return;
            }
        }

        try {
            const response = await fetch('http://localhost:3001/api/justifications/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: selectedEmployeeId,
                    date,
                    type,
                    description
                })
            });

            if (response.ok) {
                fetchHistory();
            }
        } catch (error) {
            console.error('Error toggling justification:', error);
        }
    };

    useEffect(() => {
        fetchEmployees();

    }, []);

    useEffect(() => {
        if (selectedEmployeeId) {
            fetchAvailableMonths();
        } else {
            setEntries([]);
            setAvailableMonths([]);
        }
    }, [selectedEmployeeId]);

    useEffect(() => {
        if (selectedEmployeeId) {
            fetchHistory();
        }
    }, [selectedEmployeeId, selectedMonth, selectedYear]);

    const getGroupedHistory = () => {
        const employee = employees?.find(e => e.id === selectedEmployeeId);
        if (!employee) return [];

        const safeEntries = Array.isArray(entries) ? entries : [];

        const safeJustifications = Array.isArray(justifications) ? justifications : [];

        const start = startOfMonth(new Date(selectedYear, selectedMonth - 1));
        const end = endOfMonth(new Date(selectedYear, selectedMonth - 1));
        const days = eachDayOfInterval({ start, end });

        const groupsArray = days.map(day => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayEntries = safeEntries.filter(e => {
                const eDate = new Date(e.timestamp);
                return format(eDate, "yyyy-MM-dd") === dateStr;
            });

            dayEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            let totalMinutes = 0;
            let lastIn: any = null;
            dayEntries.forEach((punch: any) => {
                if (punch.type === 'IN') {
                    lastIn = new Date(punch.timestamp);
                } else if (punch.type === 'OUT' && lastIn) {
                    const diff = (new Date(punch.timestamp).getTime() - lastIn.getTime()) / (1000 * 60);
                    totalMinutes += diff;
                    lastIn = null;
                }
            });
            const justification = safeJustifications.find((j: any) => {
                const jDate = new Date(j.date);
                return format(jDate, "yyyy-MM-dd") === dateStr;
            });

            // Check if global holiday
            const globalHoliday = isDateHoliday(day, holidays);
            const holidayText = globalHoliday ? `FERIADO: ${globalHoliday.name}` : null;

            const dailyMetaMinutes = (employee.workSchedule?.dailyHours || 0) * 60;
            let saldoMinutes = 0;

            if (justification || globalHoliday || dayEntries.length === 0) {
                saldoMinutes = 0;
            } else if (isWeekend(new Date(dateStr + 'T12:00:00'))) {
                saldoMinutes = totalMinutes;
            } else {
                saldoMinutes = totalMinutes - dailyMetaMinutes;
            }

            return {
                date: dateStr,
                employee: employee,
                punches: dayEntries,
                totalMinutes,
                dailyMetaMinutes,
                saldoMinutes,
                justification: justification || (globalHoliday ? { type: 'FERIADO', description: globalHoliday.name } : null)
            };
        });

        // If you want to only show week days and days with entries:
        return groupsArray.filter(g => !isWeekend(new Date(g.date + 'T12:00:00')) || g.punches.length > 0 || g.justification);
    };

    const calculateRangeTotals = (start: Date, end: Date) => {
        const employee = employees?.find(e => e.id === selectedEmployeeId);
        if (!employee) return { worked: 0, saldo: 0 };

        const safeEntries = Array.isArray(entries) ? entries : [];
        const safeJustifications = Array.isArray(justifications) ? justifications : [];
        const days = eachDayOfInterval({ start, end });

        let worked = 0;
        let saldo = 0;

        days.forEach(day => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayEntries = safeEntries.filter(e => format(new Date(e.timestamp), "yyyy-MM-dd") === dateStr);
            
            let dailyWorked = 0;
            let lastIn: any = null;
            dayEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).forEach((punch: any) => {
                if (punch.type === 'IN') lastIn = new Date(punch.timestamp);
                else if (punch.type === 'OUT' && lastIn) {
                    dailyWorked += (new Date(punch.timestamp).getTime() - lastIn.getTime()) / (1000 * 60);
                    lastIn = null;
                }
            });

            const justification = safeJustifications.find((j: any) => new Date(j.date).toISOString().split('T')[0] === dateStr);
            const globalHoliday = isDateHoliday(day, holidays);
            const dailyMetaMinutes = (employee.workSchedule?.dailyHours || 0) * 60;

            worked += dailyWorked;
            if (!justification && !globalHoliday && dayEntries.length > 0) {
                if (isWeekend(new Date(dateStr + 'T12:00:00'))) {
                    saldo += dailyWorked;
                } else {
                    saldo += (dailyWorked - dailyMetaMinutes);
                }
            }
        });

        return { worked, saldo };
    };

    const calculateMonthlyTotals = () => {
        const start = startOfMonth(new Date(selectedYear, selectedMonth - 1));
        const end = endOfMonth(new Date(selectedYear, selectedMonth - 1));
        const res = calculateRangeTotals(start, end);
        return {
            totalWorked: res.worked,
            totalSaldo: res.saldo
        };
    };

    const calculateSemesterTotals = () => {
        const s1Start = new Date(selectedYear, 0, 1);
        const s1End = new Date(selectedYear, 5, 30, 23, 59, 59);
        const s2Start = new Date(selectedYear, 6, 1);
        const s2End = new Date(selectedYear, 11, 31, 23, 59, 59);

        return {
            s1: calculateRangeTotals(s1Start, s1End),
            s2: calculateRangeTotals(s2Start, s2End)
        };
    };

    const formatHours = (minutes: number) => {
        const total = Math.abs(minutes);
        const h = Math.floor(total / 60);
        const m = Math.round(total % 60);
        return `${h}h ${m}m`;
    };

    const formatBalance = (minutes: number) => {
        const sign = minutes > 0 ? '+' : minutes < 0 ? '-' : '';
        return `${sign}${formatHours(minutes)}`;
    };

    const exportToPDF = async (monthsToExport: { month: number, year: number }[]) => {
        const doc = new jsPDF();
        const employee = employees.find(e => e.id === selectedEmployeeId);
        if (!employee) return;

        setLoading(true);

        try {
            // Sort months chronologically
            const sortedMonths = [...monthsToExport].sort((a, b) => a.year - b.year || a.month - b.month);

            // Fetch ALL data once at the beginning
            const [historyRes, justificationsRes] = await Promise.all([
                fetch(`http://localhost:3001/api/history?employeeId=${selectedEmployeeId}`),
                fetch(`http://localhost:3001/api/justifications?employeeId=${selectedEmployeeId}`)
            ]);
            
            const allHistory = await historyRes.json();
            const allJustifications = await justificationsRes.json();

            for (let i = 0; i < sortedMonths.length; i++) {
                const { month, year } = sortedMonths[i];
                
                // Process data for this month
                const start = startOfMonth(new Date(year, month - 1));
                const end = endOfMonth(new Date(year, month - 1));
                const days = eachDayOfInterval({ start, end });

                const groupedHistory = days.map(day => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const dayEntries = allHistory.filter((e: any) => format(new Date(e.timestamp), "yyyy-MM-dd") === dateStr);
                    
                    let totalMinutes = 0;
                    let lastIn: any = null;
                    dayEntries.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).forEach((punch: any) => {
                        if (punch.type === 'IN') lastIn = new Date(punch.timestamp);
                        else if (punch.type === 'OUT' && lastIn) {
                            totalMinutes += (new Date(punch.timestamp).getTime() - lastIn.getTime()) / (1000 * 60);
                            lastIn = null;
                        }
                    });

                    const justification = allJustifications.find((j: any) => format(new Date(j.date), "yyyy-MM-dd") === dateStr);
                    const dailyMetaMinutes = (employee.workSchedule?.dailyHours || 0) * 60;
                    let saldoMinutes = 0;

                    if (justification || dayEntries.length === 0) {
                        saldoMinutes = 0;
                    } else if (isWeekend(new Date(dateStr + 'T12:00:00'))) {
                        saldoMinutes = totalMinutes;
                    } else {
                        saldoMinutes = totalMinutes - dailyMetaMinutes;
                    }

                    return {
                        date: dateStr,
                        punches: dayEntries,
                        totalMinutes,
                        saldoMinutes,
                        justification
                    };
                }).filter(g => !isWeekend(new Date(g.date + 'T12:00:00')) || g.punches.length > 0 || g.justification);

                // Month totals for summary
                const monthlyTotals = calculateRangeTotalsForExport(start, end, allHistory, allJustifications, employee);
                
                // Semester totals calculation
                const isFirstSemester = month <= 6;
                const semStart = isFirstSemester ? new Date(year, 0, 1) : new Date(year, 6, 1);
                const semEnd = isFirstSemester ? new Date(year, 5, 30, 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59);
                const semesterTotals = calculateRangeTotalsForExport(semStart, semEnd, allHistory, allJustifications, employee);

                const monthName = format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: ptBR });
                const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

                if (i > 0) doc.addPage();

                // Document Title
                doc.setFontSize(18);
                doc.setTextColor(33, 33, 33);
                doc.text("Relatório de Frequência", 14, 20);

                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 26);

                // Header Section
                doc.setFontSize(10);
                doc.setTextColor(33, 33, 33);
                doc.setFont("helvetica", "bold");
                doc.text("Estagiário(a):", 14, 38);
                doc.setFont("helvetica", "normal");
                doc.text(`${employee.name}`, 39, 38);

                doc.setFont("helvetica", "bold");
                doc.text("Matrícula:", 100, 38);
                doc.setFont("helvetica", "normal");
                doc.text(`${employee.registrationId}`, 118, 38);

                doc.setFont("helvetica", "bold");
                doc.text("Curso:", 145, 38);
                doc.setFont("helvetica", "normal");
                doc.text(`${employee.course}`, 158, 38);

                doc.setFont("helvetica", "bold");
                doc.text("Mês de Referência:", 14, 44);
                doc.setFont("helvetica", "normal");
                doc.text(`${capitalizedMonth}`, 48, 44);

                // Summary Section
                doc.setDrawColor(220, 220, 220);
                doc.line(14, 50, 196, 50);

                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(`SALDO NO ${isFirstSemester ? '1º' : '2º'} SEMESTRE:`, 14, 58);
                doc.setFont("helvetica", "normal");
                doc.text(`${formatBalance(semesterTotals.saldo)}`, 64, 58);

                doc.setFont("helvetica", "bold");
                doc.text(`SALDO NO MÊS:`, 105, 58);
                doc.setFont("helvetica", "normal");
                const saldo = monthlyTotals.saldo;
                doc.setTextColor(saldo >= 0 ? 0 : 200, saldo >= 0 ? 100 : 0, 0);
                doc.text(`${formatBalance(saldo)}`, 136, 58);
                doc.setTextColor(33, 33, 33);

                doc.line(14, 64, 196, 64);

                // Table
                const tableData = groupedHistory.map((group: any) => [
                    format(new Date(group.date + 'T12:00:00'), "dd/MM/yyyy"),
                    format(new Date(group.date + 'T12:00:00'), "EEEE", { locale: ptBR }),
                    group.punches.map((p: any) => format(new Date(p.timestamp), "HH:mm")).join(" | "),
                    group.justification ? group.justification.type : formatHours(group.totalMinutes),
                    group.justification ? '-' : formatBalance(group.saldoMinutes)
                ]);

                autoTable(doc, {
                    startY: 70,
                    head: [['Data', 'Dia da Semana', 'Registros', 'Total Dia', 'Saldo']],
                    body: tableData,
                    styles: { fontSize: 8, cellPadding: 3 },
                    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [245, 247, 250] },
                    margin: { top: 75 }
                });
            }

            const fileName = monthsToExport.length === 1 
                ? `Frequencia_${employee.name.replace(/\s+/g, '_')}_${monthsToExport[0].month}_${monthsToExport[0].year}.pdf`
                : `Frequencia_Periodo_${employee.name.replace(/\s+/g, '_')}.pdf`;
            
            doc.save(fileName);
        } catch (err) {
            console.error("Erro ao gerar PDF:", err);
            alert("Erro ao gerar o documento PDF.");
        } finally {
            setLoading(false);
        }
    };

    // Helper for calculateRangeTotals within export with external data
    const calculateRangeTotalsForExport = (start: Date, end: Date, rawHistory: any[], rawJustifications: any[], employee: any) => {
        const days = eachDayOfInterval({ start, end });
        let worked = 0;
        let saldo = 0;

        days.forEach(day => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayEntries = rawHistory.filter(e => format(new Date(e.timestamp), "yyyy-MM-dd") === dateStr);
            
            let dailyWorked = 0;
            let lastIn: any = null;
            dayEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).forEach((punch: any) => {
                if (punch.type === 'IN') lastIn = new Date(punch.timestamp);
                else if (punch.type === 'OUT' && lastIn) {
                    dailyWorked += (new Date(punch.timestamp).getTime() - lastIn.getTime()) / (1000 * 60);
                    lastIn = null;
                }
            });

            const justification = rawJustifications.find((j: any) => format(new Date(j.date), "yyyy-MM-dd") === dateStr);
            const globalHoliday = isDateHoliday(day, holidays);
            const dailyMetaMinutes = (employee.workSchedule?.dailyHours || 0) * 60;

            worked += dailyWorked;
            if (!justification && !globalHoliday && dayEntries.length > 0) {
                if (isWeekend(new Date(dateStr + 'T12:00:00'))) {
                    saldo += dailyWorked;
                } else {
                    saldo += (dailyWorked - dailyMetaMinutes);
                }
            }
        });

        return { worked, saldo };
    };

    const handleUpdateEntry = async () => {
        if (!editingInEntry && !editingOutEntry && !isAdding) return;

        try {
            const dateStr = isAdding ? isAdding.date : format(new Date(editingInEntry ? editingInEntry.timestamp : editingOutEntry.timestamp), "yyyy-MM-dd");
            
            if (modalMode === 'JUSTIFICATIVA') {
                await toggleJustification(dateStr, justificationType, justificationDesc);
                setEditingInEntry(null);
                setEditingOutEntry(null);
                setIsAdding(null);
                return;
            }

            // Se estivermos em modo REGISTRO, validar se há horários e remover conflito com justificativa
            if (!editTimeIn && !editTimeOut) {
                alert("Por favor, preencha ao menos um horário (Entrada ou Saída).");
                return;
            }

            const existingJ = justifications.find(j => format(new Date(j.date), "yyyy-MM-dd") === dateStr);
            if (existingJ) {
                const confirmRemove = window.confirm(`Atenção: Este dia já possui uma justificativa (${existingJ.type}). Deseja remover a justificativa para registrar estes horários?`);
                if (!confirmRemove) return;
                
                await fetch('http://localhost:3001/api/justifications/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        employeeId: selectedEmployeeId,
                        date: dateStr,
                        type: existingJ.type,
                        description: existingJ.description
                    })
                });
                await fetchHistory();
            }

            const saveEntry = async (entryId: string | null, time: string, type: 'IN' | 'OUT') => {
                if (!time) return;
                
                // Converter data local + hora local para string com offset local
                const [y, mo, d] = dateStr.split('-').map(Number);
                const [h, mi] = time.split(':').map(Number);
                const localDate = new Date(y, mo - 1, d, h, mi);
                const dbTimestamp = format(localDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
                
                if (entryId) {
                    await fetch(`http://localhost:3001/api/time-entries/${entryId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            timestamp: dbTimestamp,
                            type
                        })
                    });
                } else {
                    const employeeId = isAdding ? isAdding.employeeId : (editingInEntry || editingOutEntry).employeeId;
                    await fetch(`http://localhost:3001/api/register-manual`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            employeeId,
                            timestamp: dbTimestamp,
                            type
                        })
                    });
                }
            };

            await saveEntry(editingInEntry?.id, editTimeIn, 'IN');
            await saveEntry(editingOutEntry?.id, editTimeOut, 'OUT');

            fetchHistory();
            setEditingInEntry(null);
            setEditingOutEntry(null);
            setIsAdding(null);
        } catch (err) {
            console.error("Erro ao salvar:", err);
        }
    };

    const handleDeleteDay = async (group: any) => {
        const { punches, justification, date } = group;
        if ((!punches || punches.length === 0) && !justification) return;

        if (!confirm("Tem certeza que deseja apagar todos os registros deste dia?")) return;

        try {
            // Deletar batimentos de ponto
            if (punches && punches.length > 0) {
                for (const p of punches) {
                    await fetch(`http://localhost:3001/api/time-entries/${p.id}`, {
                        method: 'DELETE'
                    });
                }
            }

            // Deletar justificativa se houver
            if (justification) {
                await fetch('http://localhost:3001/api/justifications/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        employeeId: selectedEmployeeId,
                        date: date,
                        type: justification.type,
                        description: justification.description
                    })
                });
            }

            fetchHistory();
        } catch (err) {
            console.error("Erro ao apagar registros do dia:", err);
            alert("Erro ao apagar registros.");
        }
    };

    const handleDeleteEntry = async () => {
        if (!editingInEntry && !editingOutEntry) return;
        if (!confirm("Tem certeza que deseja excluir estes registros?")) return;

        try {
            if (editingInEntry) {
                await fetch(`http://localhost:3001/api/time-entries/${editingInEntry.id}`, {
                    method: 'DELETE'
                });
            }
            if (editingOutEntry) {
                await fetch(`http://localhost:3001/api/time-entries/${editingOutEntry.id}`, {
                    method: 'DELETE'
                });
            }
            fetchHistory();
            setEditingInEntry(null);
            setEditingOutEntry(null);
        } catch (err) {
            console.error("Erro ao excluir:", err);
        }
    };

    const handleInPlaceUpdate = async (entryId: string, newTime: string, date: string, type: 'IN' | 'OUT') => {
        try {
            // Converter componentes locais para string com offset local
            const [y, mo, d] = date.split('-').map(Number);
            const [h, mi] = newTime.split(':').map(Number);
            const localDate = new Date(y, mo - 1, d, h, mi);
            const dbTimestamp = format(localDate, "yyyy-MM-dd'T'HH:mm:ssXXX"); 

            const response = await fetch(`http://localhost:3001/api/time-entries/${entryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp: dbTimestamp, 
                    type
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao atualizar no servidor');
            }

            fetchHistory();
            setInlineEditId(null);
        } catch (err: any) {
            console.error("Erro ao atualizar horário:", err);
            alert("Não foi possível salvar a alteração: " + err.message);
            fetchHistory();
            setInlineEditId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        {selectedEmployeeId ? 'Histórico de Frequência' : 'Consultar Histórico'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {selectedEmployeeId
                            ? `Exibindo registros de ${employees.find(e => e.id === selectedEmployeeId)?.name}`
                            : 'Selecione abaixo o estagiário para auditar a carga horária'}
                    </p>
                </div>

                {selectedEmployeeId && (
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white border-2 border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm hover:border-brand-200 transition-all">
                            <select
                                value={`${selectedMonth}-${selectedYear}`}
                                onChange={(e) => {
                                    const [m, y] = e.target.value.split('-').map(Number);
                                    setSelectedMonth(m);
                                    setSelectedYear(y);
                                }}
                                className="pl-6 pr-12 py-4 text-base font-black text-slate-800 bg-transparent focus:outline-none appearance-none cursor-pointer"
                            >
                                {availableMonths.length === 0 ? (
                                    <option value={`${new Date().getMonth() + 1}-${new Date().getFullYear()}`}>
                                        {format(new Date(), "MMMM yyyy", { locale: ptBR })}
                                    </option>
                                ) : (
                                    availableMonths.map(d => (
                                        <option key={`${d.month}-${d.year}`} value={`${d.month}-${d.year}`}>
                                            {format(new Date(d.year, d.month - 1, 1), "MMMM yyyy", { locale: ptBR })}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <button
                            onClick={fetchHistory}
                            className="p-3 bg-white border-2 border-slate-100 hover:border-brand-500 hover:text-brand-600 rounded-2xl text-slate-400 transition-all shadow-sm group"
                            title="Atualizar Dados"
                        >
                            <ArrowRightLeft size={20} className="rotate-90 group-hover:scale-110 transition-transform" />
                        </button>

                        <button
                            onClick={() => {
                                setSelectedPDFMonths([{ month: selectedMonth, year: selectedYear }]);
                                setShowPDFModal(true);
                            }}
                            className="flex items-center gap-2 px-5 py-3 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
                        >
                            <FileDown size={16} />
                            Gerar PDF
                        </button>

                        <button
                            onClick={() => setSelectedEmployeeId('')}
                            className="flex items-center gap-2 px-5 py-3 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
                        >
                            <Users size={16} />
                            Trocar Estagiário
                        </button>
                    </div>
                )}
            </div>

            {/* Employee Selection Area */}
            {!selectedEmployeeId && (
                isAdmin ? (
                    /* Admin View: Show Table */
                    <div className="card !p-0 overflow-hidden border-none shadow-2xl shadow-slate-200/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Estagiário</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Curso / Área</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Matrícula</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {employees.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">
                                                Nenhum estagiário cadastrado no sistema.
                                            </td>
                                        </tr>
                                    ) : (
                                        employees.map(emp => (
                                            <tr
                                                key={emp.id}
                                                onClick={() => setSelectedEmployeeId(emp.id)}
                                                className="hover:bg-brand-50/30 transition-all cursor-pointer group"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center font-black text-sm uppercase border-2 border-transparent group-hover:border-brand-200 group-hover:bg-white transition-all">
                                                            {emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{emp.name}</p>
                                                            <p className="text-xs text-slate-400 font-medium">{emp.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-semibold text-slate-500 uppercase tracking-wider">{emp.course}</td>
                                                <td className="px-8 py-6">
                                                    <span className="font-mono font-bold text-slate-400">{emp.registrationId}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:border-brand-500 group-hover:text-brand-600 transition-all">
                                                        Ver Histórico
                                                        <ChevronRight size={14} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Student View: Show RA Input */
                    <div className="max-w-md mx-auto pt-10">
                        <div className="card p-10 bg-white shadow-2xl shadow-slate-200/50 border-none rounded-[2.5rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700" />
                            
                            <div className="relative z-10 space-y-8">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-500/20">
                                        <History size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Meus Horários</h3>
                                    <p className="text-slate-500 text-sm">Digite sua matrícula para acessar seu relatório</p>
                                </div>

                                <form 
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const emp = employees.find(e => e.registrationId === historyRegistrationId);
                                        if (emp) {
                                            setSelectedEmployeeId(emp.id);
                                            setHistoryError('');
                                        } else {
                                            setHistoryError('Matrícula não encontrada.');
                                        }
                                    }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Número da Matrícula</label>
                                        <input
                                            type="text"
                                            value={historyRegistrationId}
                                            onChange={(e) => setHistoryRegistrationId(e.target.value)}
                                            placeholder="Ex: 202410"
                                            className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-center text-2xl font-black tracking-[0.1em] text-slate-800 placeholder:text-base placeholder:font-medium placeholder:text-slate-300 placeholder:tracking-normal"
                                            autoFocus
                                        />
                                    </div>
                                    
                                    {historyError && (
                                        <div className="p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl text-center border border-rose-100 animate-in shake duration-300">
                                            {historyError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-500/30 hover:bg-brand-700 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all"
                                    >
                                        Acessar Histórico
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* History Table - Only visible if an employee is selected */}
            {selectedEmployeeId && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-6">
                    {/* Monthly & Semester Summary Cards */}
                    {!loading && getGroupedHistory().length > 0 && (() => {
                        const semesterTotals = calculateSemesterTotals();
                        const isFirstSemester = selectedMonth <= 6;
                        const currentSemester = isFirstSemester ? semesterTotals.s1 : semesterTotals.s2;
                        
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="card border-none shadow-xl shadow-slate-200/50 bg-white group hover:scale-[1.01] transition-transform">
                                    <div className="flex items-center gap-4 p-2">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${calculateMonthlyTotals().totalSaldo >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            <ArrowRightLeft size={28} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Saldo Mensal</p>
                                            <p className={`text-3xl font-black font-mono mt-0.5 ${calculateMonthlyTotals().totalSaldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatBalance(calculateMonthlyTotals().totalSaldo)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="card border-none shadow-xl shadow-slate-200/50 bg-white group hover:scale-[1.01] transition-transform">
                                    <div className="flex items-center gap-4 p-2">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${currentSemester.saldo >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {isFirstSemester ? <GraduationCap size={28} /> : <Briefcase size={28} />}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                                Saldo {isFirstSemester ? '1º' : '2º'} Semestre ({isFirstSemester ? 'Jan-Jun' : 'Jul-Dez'})
                                            </p>
                                            <p className={`text-3xl font-black font-mono mt-0.5 ${currentSemester.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatBalance(currentSemester.saldo)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="card overflow-hidden !p-0 border-none shadow-2xl shadow-slate-200/50 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="w-[120px] px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Data</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Registros Diários</th>
                                        <th className="w-[200px] px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Carga Horária</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {loading ? (
                                        <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-bold animate-pulse">Consultando banco de dados...</td></tr>
                                    ) : getGroupedHistory().length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-2 border-2 border-dashed border-slate-100">
                                                        <History size={40} />
                                                    </div>
                                                    <p className="font-black text-slate-800 text-lg">Nenhum registro</p>
                                                    <p className="text-sm text-slate-400">Este estagiário ainda não registrou pontos.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : getGroupedHistory().map((group: any) => {
                                            const getBgColor = () => {
                                                if (!group.justification) return 'hover:bg-slate-50/50';
                                                // Todas as justificativas agora usam o mesmo padrão rosa claro (rose)
                                                return 'bg-rose-100/60 hover:bg-rose-200/50 text-rose-900';
                                            };

                                        return (
                                            <tr key={`${group.date}-${selectedEmployeeId}`} className={`transition-colors group ${getBgColor()}`}>
                                                <td className="px-8 py-8 align-middle">
                                                    <div className="flex flex-col items-start cursor-default">
                                                        <span className={`text-lg font-black leading-none ${group.justification ? 'text-rose-500' : 'text-slate-800'}`}>
                                                            {format(new Date(group.date + 'T12:00:00'), "dd/MM")}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                            {format(new Date(group.date + 'T12:00:00'), "EEEE", { locale: ptBR })}
                                                        </span>
                                                    </div>
                                                </td>
                                            <td className="px-8 py-8 align-middle">
                                                <div className="flex flex-wrap justify-center items-center gap-3 relative">


                                                    {group.justification ? (
                                                        <button 
                                                            onClick={() => {
                                                                setIsAdding({ date: group.date, employeeId: group.employee.id });
                                                                setModalMode('JUSTIFICATIVA');
                                                                setJustificationType(group.justification.type);
                                                                setJustificationDesc(group.justification.description || '');
                                                            }}
                                                            className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 hover:scale-105 transition-transform"
                                                        >
                                                            <span className={`text-sm font-black uppercase tracking-wide font-mono text-center ${group.justification ? 'text-rose-600' : 'text-brand-600'}`}>
                                                                {group.justification.type}
                                                            </span>
                                                            {group.justification.description && (
                                                                <span className="text-[10px] font-bold text-slate-400 mt-1">
                                                                    {group.justification.description}
                                                                </span>
                                                            )}
                                                        </button>
                                                    ) : null}
                                                    
                                                    {group.punches.map((p: any) => {
                                                        const isEditingInline = inlineEditId === p.id;
                                                        
                                                        return (
                                                            <div key={p.id} className="relative group/punch">
                                                                {isEditingInline ? (
                                                                    <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                                                                        <input
                                                                            autoFocus
                                                                            type="time"
                                                                            value={inlineEditTime}
                                                                            onChange={(e) => setInlineEditTime(e.target.value)}
                                                                            onBlur={() => {
                                                                                if (inlineEditTime && inlineEditTime !== formatDisplayTime(p.timestamp)) {
                                                                                    handleInPlaceUpdate(p.id, inlineEditTime, group.date, p.type);
                                                                                } else {
                                                                                    setInlineEditId(null);
                                                                                }
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    handleInPlaceUpdate(p.id, inlineEditTime, group.date, p.type);
                                                                                } else if (e.key === 'Escape') {
                                                                                    setInlineEditId(null);
                                                                                }
                                                                            }}
                                                                            className={`px-4 py-3 rounded-2xl text-lg font-black border-2 outline-none focus:ring-4 transition-all w-[140px] text-center ${p.type === 'IN' ? 'bg-white text-green-700 border-green-400 focus:ring-green-500/10' : 'bg-white text-red-600 border-red-400 focus:ring-red-500/10'}`}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (!isAdmin) return;
                                                                            // Se clicar com Shift ou for um clique simples mas o usuário quer agilidade, 
                                                                            // vamos permitir o edit in-place.
                                                                            setInlineEditId(p.id);
                                                                            setInlineEditTime(formatDisplayTime(p.timestamp));
                                                                        }}
                                                                        onContextMenu={(e) => {
                                                                            if (!isAdmin) return;
                                                                            e.preventDefault();
                                                                            setContextMenu({
                                                                                x: e.clientX,
                                                                                y: e.clientY,
                                                                                punchId: p.id
                                                                            });
                                                                        }}
                                                                        className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-lg font-black border-2 transition-all hover:scale-110 hover:shadow-md cursor-pointer relative z-10 ${p.type === 'IN' ? 'bg-green-50 text-green-700 border-green-100 hover:border-green-300' : 'bg-red-50 text-red-600 border-red-100 hover:border-red-300'}`}
                                                                        title="Clique para editar rápido | Botão direito para excluir/editar par"
                                                                    >
                                                                        <div className={`w-2.5 h-2.5 rounded-full ${p.type === 'IN' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                        {formatDisplayTime(p.timestamp)}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {isAdmin && !group.justification && group.punches.length < 2 && (
                                                        <button
                                                            onClick={() => {
                                                                setIsAdding({ date: group.date, employeeId: group.employee.id });
                                                                
                                                                if (group.punches.length === 1) {
                                                                    const p = group.punches[0];
                                                                    if (p.type === 'IN') {
                                                                        setEditingInEntry(p);
                                                                        setEditTimeIn(format(new Date(p.timestamp), "HH:mm"));
                                                                        setEditingOutEntry(null);
                                                                        setEditTimeOut(group.employee.defaultExitTime || "12:00");
                                                                    } else {
                                                                        setEditingOutEntry(p);
                                                                        setEditTimeOut(format(new Date(p.timestamp), "HH:mm"));
                                                                        setEditingInEntry(null);
                                                                        setEditTimeIn(group.employee.defaultEntryTime || "08:00");
                                                                    }
                                                                } else {
                                                                    setEditTimeIn(group.employee.defaultEntryTime || "08:00");
                                                                    setEditTimeOut(group.employee.defaultExitTime || "12:00");
                                                                    setEditingInEntry(null);
                                                                    setEditingOutEntry(null);
                                                                }
                                                                
                                                                setModalMode('REGISTRO');
                                                            }}
                                                            className="w-8 h-8 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 flex items-center justify-center hover:bg-brand-50 hover:border-brand-300 hover:text-brand-600 transition-all hover:scale-110 relative z-10"
                                                            title="Adicionar registro manual"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    )}

                                                    {isAdmin && (group.punches.length > 0 || group.justification) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteDay(group);
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-40 hover:opacity-100"
                                                            title="Apagar todos os registros do dia"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 text-right align-middle">
                                                <div className="inline-flex flex-col items-end gap-2">
                                                    <div className="flex items-center justify-end gap-8">
                                                        <div className="text-right">
                                                            <p className="text-2xl font-black text-slate-900 font-mono leading-none whitespace-nowrap">
                                                                {formatHours(group.totalMinutes)}
                                                            </p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">Realizado</p>
                                                        </div>

                                                        {group.punches.length > 0 && group.punches.length % 2 === 0 && !group.justification && (
                                                            <div className="text-right">
                                                                <p className={`text-base font-black whitespace-nowrap ${group.saldoMinutes > 0 ? 'text-emerald-500' : group.saldoMinutes < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                                    {formatBalance(group.saldoMinutes)}
                                                                </p>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Saldo</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col items-end w-full">
                                                        {group.punches.length % 2 !== 0 && (
                                                            <div className="px-3 py-1 bg-amber-500 text-white rounded-full text-[10px] font-black shadow-lg shadow-amber-500/20 animate-pulse">
                                                                EM ABERTO
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}



            {/* Edit/Add Entry Modal */}
            {(editingInEntry || editingOutEntry || isAdding) && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                    {isAdding ? 'Adicionar Registro' : 'Editar Registro'}
                                </h3>
                                <button onClick={() => { setEditingInEntry(null); setEditingOutEntry(null); setIsAdding(null); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-8 px-1">
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    <Calendar size={14} className="text-slate-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-none mb-1">Data Selecionada</span>
                                    <span className="text-sm font-black text-slate-700">
                                        {format(new Date(isAdding ? `${isAdding.date}T12:00:00` : (editingInEntry || editingOutEntry).timestamp), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex bg-slate-100 p-1.5 rounded-3xl mb-8 relative border-2 border-slate-200">
                                <div 
                                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-2xl shadow-md transition-all duration-300 ease-out ${modalMode === 'JUSTIFICATIVA' ? 'left-[calc(50%+3px)]' : 'left-1.5'}`}
                                />
                                <button
                                    onClick={() => setModalMode('REGISTRO')}
                                    className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all relative z-10 ${modalMode === 'REGISTRO' ? 'text-brand-600' : 'text-brand-400 hover:text-brand-500'}`}
                                >
                                    Registro
                                </button>
                                <button
                                    onClick={() => setModalMode('JUSTIFICATIVA')}
                                    className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all relative z-10 ${modalMode === 'JUSTIFICATIVA' ? 'text-rose-600' : 'text-rose-400 hover:text-rose-500'}`}
                                >
                                    Justificativa
                                </button>
                            </div>

                            {modalMode === 'REGISTRO' ? (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.1em]">Entrada</label>
                                            </div>
                                            <div className="relative group">
                                                <input
                                                    type="time"
                                                    value={editTimeIn}
                                                    onChange={(e) => setEditTimeIn(e.target.value)}
                                                    className="w-full px-4 py-6 bg-emerald-50/30 border-[3px] border-emerald-200 rounded-[24px] focus:outline-none focus:border-emerald-500 focus:bg-white text-3xl font-black transition-all text-center group-hover:border-emerald-400 text-slate-800 shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.1em]">Saída</label>
                                            </div>
                                            <div className="relative group">
                                                <input
                                                    type="time"
                                                    value={editTimeOut}
                                                    onChange={(e) => setEditTimeOut(e.target.value)}
                                                    className="w-full px-4 py-6 bg-rose-50/30 border-[3px] border-rose-200 rounded-[24px] focus:outline-none focus:border-rose-500 focus:bg-white text-3xl font-black transition-all text-center group-hover:border-rose-400 text-slate-800 shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        {['EMENDA', 'DISPENSA', 'ATESTADO', 'OUTROS'].map(type => {
                                            const isSelected = justificationType === type;
                                            const styles: Record<string, string> = {
                                                'EMENDA': isSelected ? 'bg-rose-50 border-rose-500 text-rose-700' : 'hover:border-rose-300 hover:bg-rose-50/50',
                                                'DISPENSA': isSelected ? 'bg-rose-50 border-rose-500 text-rose-700' : 'hover:border-rose-300 hover:bg-rose-50/50',
                                                'ATESTADO': isSelected ? 'bg-rose-50 border-rose-500 text-rose-700' : 'hover:border-rose-300 hover:bg-rose-50/50',
                                                'OUTROS': isSelected ? 'bg-rose-50 border-rose-500 text-rose-700' : 'hover:border-rose-300 hover:bg-rose-50/50'
                                            };
                                            
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => setJustificationType(type)}
                                                    className={`py-5 px-2 rounded-2xl transition-all border-[3px] flex flex-col items-center gap-1 group/btn shadow-sm hover:shadow-md active:scale-95 ${isSelected ? styles[type] + ' shadow-lg scale-[1.02]' : 'bg-white border-slate-200 text-slate-400'}`}
                                                >
                                                    <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isSelected ? '' : 'group-hover/btn:text-slate-600'}`}>
                                                        {type}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {justificationType === 'OUTROS' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Motivo Específico</label>
                                            <textarea
                                                value={justificationDesc}
                                                onChange={(e) => setJustificationDesc(e.target.value)}
                                                placeholder="Descreva o motivo da ausência..."
                                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-brand-500 text-sm font-medium h-24 transition-all"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-10 flex flex-col gap-4">
                                <button
                                    onClick={handleUpdateEntry}
                                    className="w-full py-5 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-brand-500/30 hover:bg-brand-700 hover:-translate-y-0.5 transition-all active:translate-y-0 active:scale-95 border-b-4 border-brand-800"
                                >
                                    Salvar Alterações
                                </button>
                                {modalMode === 'REGISTRO' && (editingInEntry || editingOutEntry) && (
                                    <button
                                        onClick={handleDeleteEntry}
                                        className="w-full py-3.5 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 border-2 border-transparent hover:border-red-100 rounded-2xl transition-all"
                                    >
                                        Excluir Registros
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Context Menu */}
            {contextMenu && (
                <div 
                    className="fixed z-[9999] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden py-2 animate-in fade-in zoom-in duration-200 w-56"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        onClick={() => {
                            const pId = contextMenu.punchId;
                            const punch = entries.find(e => e.id === pId);
                            if (punch) {
                                // Encontrar o par para o modal
                                const group = getGroupedHistory().find((g: any) => 
                                    g.punches.some((p: any) => p.id === pId)
                                );
                                if (group) {
                                    const index = group.punches.findIndex((p: any) => p.id === pId);
                                    let inEntry = null;
                                    let outEntry = null;
                                    if (punch.type === 'IN') {
                                        inEntry = punch;
                                        const next = group.punches[index + 1];
                                        if (next && next.type === 'OUT') outEntry = next;
                                    } else {
                                        outEntry = punch;
                                        const prev = group.punches[index - 1];
                                        if (prev && prev.type === 'IN') inEntry = prev;
                                    }
                                    setEditingInEntry(inEntry);
                                    setEditingOutEntry(outEntry);
                                    setEditTimeIn(inEntry ? formatDisplayTime(inEntry.timestamp) : '');
                                    setEditTimeOut(outEntry ? formatDisplayTime(outEntry.timestamp) : '');
                                    setIsAdding(null);
                                    setModalMode('REGISTRO');
                                }
                            }
                            setContextMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm"
                    >
                        <History size={16} className="text-brand-500" />
                        Editar par de horários
                    </button>
                    <div className="h-px bg-slate-100 mx-2 my-1" />
                    <button
                        onClick={() => {
                            if (contextMenu.punchId) handleDeleteSinglePunch(contextMenu.punchId);
                            setContextMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 transition-colors text-rose-600 font-bold text-sm"
                    >
                        <Trash2 size={16} />
                        Excluir este horário
                    </button>
                </div>
            )}

            {/* Modal de Seleção de Meses para PDF */}
            {showPDFModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <FileDown size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Exportar Relatório</h3>
                                <p className="text-slate-500 text-sm">Selecione os meses que deseja incluir no documento</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                                {availableMonths.map((m) => {
                                    const isSelected = selectedPDFMonths.some(sel => sel.month === m.month && sel.year === m.year);
                                    return (
                                        <button
                                            key={`${m.month}-${m.year}`}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedPDFMonths(selectedPDFMonths.filter(sel => !(sel.month === m.month && sel.year === m.year)));
                                                } else {
                                                    setSelectedPDFMonths([...selectedPDFMonths, m]);
                                                }
                                            }}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                                isSelected 
                                                ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-md scale-[1.02]' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                            }`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">{m.year}</span>
                                            <span className="text-sm font-bold capitalize">
                                                {format(new Date(m.year, m.month - 1, 1), "MMMM", { locale: ptBR })}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowPDFModal(false)}
                                    className="flex-1 py-4 text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={selectedPDFMonths.length === 0}
                                    onClick={() => {
                                        exportToPDF(selectedPDFMonths);
                                        setShowPDFModal(false);
                                    }}
                                    className="flex-[2.5] py-4 bg-brand-600 text-white font-black text-xs uppercase tracking-tight rounded-2xl shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 px-2"
                                >
                                    Gerar Documento ({selectedPDFMonths.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LoginModal = ({ onLogin, onClose }: { onLogin: () => void, onClose: () => void }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                onLogin();
            } else {
                setError('Senha incorreta.');
            }
        } catch (err) {
            setError('Erro ao conectar ao servidor.');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-4">
                            <Briefcase size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Acesso Administrativo</h3>
                        <p className="text-sm text-slate-500 mt-1">Digite a senha para gerenciar o sistema</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            autoFocus
                            type="password"
                            placeholder="Senha do administrador"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-center text-lg font-bold"
                        />
                        {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
                        
                        <div className="pt-4 flex flex-col gap-3">
                            <button
                                type="submit"
                                className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all"
                            >
                                Acessar Painel
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                            >
                                Voltar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

function App() {
    const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');
    const [activeTab, setActiveTab] = useState(() => {
        const savedAdmin = localStorage.getItem('isAdmin') === 'true';
        return savedAdmin ? 'history' : 'punch';
    });
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [holidays, setHolidays] = useState<any[]>([]);

    const fetchHolidays = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/holidays');
            const data = await response.json();
            setHolidays(data);
        } catch (error) {
            console.error('Error fetching holidays:', error);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleLogin = () => {
        setIsAdmin(true);
        localStorage.setItem('isAdmin', 'true');
        setShowLoginModal(false);
        if (activeTab === 'punch') {
            setActiveTab('history');
        }
    };

    const handleLogout = () => {
        setIsAdmin(false);
        localStorage.removeItem('isAdmin');
        setActiveTab('punch');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#fafbfc]">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 px-2 mb-10">
                    <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                        <Clock className="text-white" size={24} />
                    </div>
                    <span className="text-xl font-black tracking-tight text-slate-900">Ponto <span className="text-brand-600">Estagiários</span></span>
                </div>

                <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                    {!isAdmin && (
                        <SidebarItem
                            icon={Clock}
                            label="Registrar Ponto"
                            active={activeTab === 'punch'}
                            onClick={() => setActiveTab('punch')}
                        />
                    )}

                    <SidebarItem
                        icon={History}
                        label="Histórico"
                        active={activeTab === 'history'}
                        onClick={() => setActiveTab('history')}
                    />

                    {isAdmin && (
                        <>
                            <div className="pt-8 pb-2 px-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Administração</span>
                            </div>
                            <SidebarItem
                                icon={Users}
                                label="Funcionários"
                                active={activeTab === 'employees'}
                                onClick={() => setActiveTab('employees')}
                            />
                            <SidebarItem
                                icon={Briefcase}
                                label="Jornadas"
                                active={activeTab === 'schedules'}
                                onClick={() => setActiveTab('schedules')}
                            />
                            <SidebarItem
                                icon={Calendar}
                                label="Feriados"
                                active={activeTab === 'holidays'}
                                onClick={() => setActiveTab('holidays')}
                            />
                        </>
                    )}
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-100">
                    {isAdmin ? (
                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-black text-xs uppercase tracking-widest"
                        >
                            <LogOut size={18} />
                            Sair do sistema
                        </button>
                    ) : (
                        <button 
                            onClick={() => setShowLoginModal(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-brand-600 hover:bg-brand-50 rounded-xl transition-all font-black text-xs uppercase tracking-widest"
                        >
                            <Users size={18} />
                            Entrar como ADM
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-10">
                <div className="max-w-5xl mx-auto">
                    {activeTab === 'punch' && (
                        <div className="pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <PunchCard />
                        </div>
                    )}

                    {activeTab === 'employees' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Employees />
                        </div>
                    )}
                    {activeTab === 'schedules' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Schedules />
                        </div>
                    )}
                    {activeTab === 'holidays' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Holidays holidays={holidays} fetchHolidays={fetchHolidays} />
                        </div>
                    )}
                    {activeTab === 'history' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <HistoryView isAdmin={isAdmin} holidays={holidays} />
                        </div>
                    )}
                </div>
            </main>

            {showLoginModal && <LoginModal onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />}
        </div>
    );
}

export default App;
