require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { differenceInMinutes, startOfDay, endOfDay, format } = require('date-fns');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const crypto = require('crypto');
const app = express();
app.use(cors());
app.use(express.json());

// Service Logic
const calculateWorkedHours = async (employeeId, startDate, endDate) => {
  const { data: entries, error } = await supabase
    .from('TimeEntry')
    .select('*')
    .eq('employeeId', employeeId)
    .gte('timestamp', new Date(startDate).toISOString())
    .lte('timestamp', new Date(endDate).toISOString())
    .order('timestamp', { ascending: true });

  if (error) throw error;

  let totalMinutes = 0;
  let lastClockIn = null;

  for (const entry of entries) {
    if (entry.type === 'IN' || entry.type === 'CLOCK_IN') {
      lastClockIn = entry.timestamp;
    } else if ((entry.type === 'OUT' || entry.type === 'CLOCK_OUT') && lastClockIn) {
      totalMinutes += differenceInMinutes(new Date(entry.timestamp), new Date(lastClockIn));
      lastClockIn = null;
    }
  }

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    decimal: parseFloat((totalMinutes / 60).toFixed(2))
  };
};

// Endpoints
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (password === adminPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Senha incorreta' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { name, course, registrationId, workScheduleId, status, defaultEntryTime, defaultExitTime } = req.body;
    
    // Generate UUID if not present (simplified for this context)
    const id = crypto.randomUUID();

    const { data, error } = await supabase
      .from('Employee')
      .insert([{
        id,
        name,
        course,
        registrationId,
        workScheduleId,
        status: status || 'ACTIVE',
        defaultEntryTime: defaultEntryTime || '08:00',
        defaultExitTime: defaultExitTime || '12:00'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Employee')
      .select('*, workSchedule:WorkSchedule(*)');
    
    if (error) {
      console.error('Erro detalhado do Supabase:', error);
      return res.status(500).json({ error: error.message, details: error, data: [] });
    }
    res.json(data || []);
  } catch (error) {
    console.error('Erro de exceção no backend:', error);
    res.status(500).json({ error: error.message, stack: error.stack, data: [] });
  }
});

app.post('/api/schedules', async (req, res) => {
  try {
    const id = crypto.randomUUID();
    const { data, error } = await supabase
      .from('WorkSchedule')
      .insert([{ id, ...req.body }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/schedules', async (req, res) => {
  try {
    const { data, error } = await supabase.from('WorkSchedule').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dailyHours, weeklyHours } = req.body;
    const { data, error } = await supabase
      .from('WorkSchedule')
      .update({
        name,
        dailyHours: Number(dailyHours),
        weeklyHours: Number(weeklyHours)
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar jornada' });
  }
});

app.delete('/api/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('WorkSchedule').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Jornada excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir jornada. Verifique se existem estagiários vinculados a esta jornada.' });
  }
});

app.get('/api/check-punch/:registrationId', async (req, res) => {
  const { registrationId } = req.params;
  try {
    const { data: employee, error: empError } = await supabase
      .from('Employee')
      .select('*, workSchedule:WorkSchedule(*)')
      .eq('registrationId', registrationId)
      .single();

    if (empError || !employee) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }

    if (employee.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Você está INATIVO no sistema. Por favor, procure o administrador do ponto para regularizar seu acesso.' });
    }

    const today = startOfDay(new Date()).toISOString();
    const { data: lastEntry, error: entryError } = await supabase
      .from('TimeEntry')
      .select('*')
      .eq('employeeId', employee.id)
      .gte('timestamp', today)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.json({
      lastType: lastEntry ? lastEntry.type : null,
      lastTimestamp: lastEntry ? lastEntry.timestamp : null,
      dailyHours: employee.workSchedule ? employee.workSchedule.dailyHours : null,
      employeeName: employee.name
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
});

app.post('/api/register', async (req, res) => {
  const { registrationId, type } = req.body;
  try {
    const { data: employee, error: empError } = await supabase
      .from('Employee')
      .select('*')
      .eq('registrationId', registrationId)
      .single();

    if (empError || !employee) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }

    if (employee.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Você está INATIVO no sistema. Por favor, procure o administrador do ponto para regularizar seu acesso.' });
    }

    const id = crypto.randomUUID();
    const { data: entry, error: regError } = await supabase
      .from('TimeEntry')
      .insert([{
        id,
        employeeId: employee.id,
        type,
        timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
      }])
      .select()
      .single();

    if (regError) {
      console.error('Erro de registro no Supabase:', regError);
      throw regError;
    }

    res.status(201).json({
      message: `Registro de ${type === 'IN' ? 'Entrada' : 'Saída'} realizado com sucesso!`,
      employeeName: employee.name,
      timestamp: entry.timestamp
    });
  } catch (error) {
    console.error('Catch no endpoint POST /api/register:', error);
    res.status(500).json({ error: 'Erro ao registrar ponto', details: error.message });
  }
});

app.post('/api/register-manual', async (req, res) => {
  const { employeeId, type, timestamp } = req.body;
  try {
    const id = crypto.randomUUID();
    const { data, error } = await supabase
      .from('TimeEntry')
      .insert([{
        id,
        employeeId,
        type,
        timestamp: timestamp // Usa a string enviada pelo frontend sem alteração
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro de registro manual no Supabase:', error);
      throw error;
    }
    res.status(201).json(data);
  } catch (error) {
    console.error('Catch no endpoint POST /api/register-manual:', error);
    res.status(500).json({ error: 'Erro ao registrar ponto manual', details: error.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    
    let query = supabase
      .from('TimeEntry')
      .select(`
        *,
        employee:Employee (
          *,
          workSchedule:WorkSchedule (*),
          justifications:Justification (*)
        )
      `)
      .order('timestamp', { ascending: false })
      .limit(200);

    if (employeeId) {
      query = query.eq('employeeId', employeeId);
    }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999).toISOString();
      query = query.gte('timestamp', startDate).lte('timestamp', endDate);
    }

    const { data: history, error } = await query;
    
    if (error) throw error;
    
    // Filtering justification by date range if provided - Supabase query doesn't nested filter easily in one go
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      
      history.forEach(entry => {
        if (entry.employee && entry.employee.justifications) {
          entry.employee.justifications = entry.employee.justifications.filter(j => {
            const d = new Date(j.date);
            return d >= startDate && d <= endDate;
          });
        }
      });
    }

    res.json(history || []);
  } catch (error) {
    console.error('Erro na API /api/history:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

app.get('/api/history/months', async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) return res.status(400).json({ error: 'employeeId is required' });

    const { data: entries, error } = await supabase
      .from('TimeEntry')
      .select('timestamp')
      .eq('employeeId', employeeId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    const months = [...new Set(entries.map(e => {
      const d = new Date(e.timestamp);
      return JSON.stringify({ month: d.getMonth() + 1, year: d.getFullYear() });
    }))].map(s => JSON.parse(s));

    res.json(months);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar meses' });
  }
});

app.get('/api/presence', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();
    const endOfDayIso = endOfDay(today).toISOString();

    const { data: employees, error } = await supabase
      .from('Employee')
      .select(`
        *,
        timeEntries:TimeEntry (*),
        justifications:Justification (*)
      `);

    if (error) throw error;

    // Filter timeEntries and justifications locally since Supabase complex subqueries are tricky
    const filteredEmployees = employees.map(emp => {
      const todayPunches = emp.timeEntries
        .filter(t => t.timestamp >= todayIso)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      const todayJustifications = emp.justifications
        .filter(j => j.date >= todayIso && j.date <= endOfDayIso);

      return {
        ...emp,
        timeEntries: todayPunches,
        justifications: todayJustifications
      };
    });

    // Filter out employees who have a justification (absence) for today
    const activeEmployees = filteredEmployees.filter(emp => emp.justifications.length === 0);

    const presence = activeEmployees.map(emp => ({
      id: emp.id,
      name: emp.name,
      registrationId: emp.registrationId,
      course: emp.course,
      status: emp.timeEntries.length > 0 ? emp.timeEntries[0].type : 'OUT',
      lastPunch: emp.timeEntries.length > 0 ? emp.timeEntries[0].timestamp : null
    }));

    res.json(presence);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar presença' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, course, registrationId, workScheduleId, status, defaultEntryTime, defaultExitTime } = req.body;

    const { data, error } = await supabase
      .from('Employee')
      .update({
        name,
        course,
        registrationId,
        workScheduleId,
        status,
        defaultEntryTime,
        defaultExitTime
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar funcionário' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('Employee').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Funcionário excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir funcionário' });
  }
});

app.put('/api/time-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { timestamp, type } = req.body;

    const { data, error } = await supabase
      .from('TimeEntry')
      .update({
        timestamp: timestamp, // Usa a string enviada pelo frontend (YYYY-MM-DD HH:mm:ss)
        type
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro de update no Supabase:', error);
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error('Catch no endpoint PUT /api/time-entries:', error);
    res.status(500).json({ error: 'Erro ao atualizar registro', details: error.message });
  }
});

app.delete('/api/time-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('TimeEntry').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Registro excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir registro' });
  }
});

app.get('/api/report/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { start, end } = req.query;
    const result = await calculateWorkedHours(employeeId, start, end);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Holiday endpoints
app.get('/api/holidays', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Holiday')
      .select('*')
      .order('month', { ascending: true })
      .order('day', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar feriados' });
  }
});

app.post('/api/holidays', async (req, res) => {
  try {
    const { name, day, month, year } = req.body;
    const id = crypto.randomUUID();
    const { data, error } = await supabase
      .from('Holiday')
      .insert([{ id, name, day: parseInt(day), month: parseInt(month), year: year ? parseInt(year) : null }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar feriado: ' + error.message });
  }
});

app.put('/api/holidays/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, day, month, year } = req.body;
    const { data, error } = await supabase
      .from('Holiday')
      .update({ name, day: parseInt(day), month: parseInt(month), year: year ? parseInt(year) : null })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar feriado' });
  }
});

app.delete('/api/holidays/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('Holiday').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Feriado excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir feriado' });
  }
});

// Justification endpoints
app.post('/api/justifications/toggle', async (req, res) => {
  try {
    const { employeeId, date, type, description } = req.body;
    const targetDate = new Date(`${date}T12:00:00`).toISOString();

    const { data: existing, error: findError } = await supabase
      .from('Justification')
      .select('*')
      .match({ employeeId, date: targetDate })
      .maybeSingle();

    if (existing) {
      if (existing.type === type && existing.description === description) {
        await supabase.from('Justification').delete().eq('id', existing.id);
        return res.json({ message: 'Justificativa removida', status: 'REMOVED' });
      } else {
        const { data: updated, error: upError } = await supabase
          .from('Justification')
          .update({ type, description })
          .eq('id', existing.id)
          .select()
          .single();
        return res.json({ message: 'Justificativa atualizada', status: 'UPDATED', data: updated });
      }
    } else {
      const id = crypto.randomUUID();
      const { data: created, error: crError } = await supabase
        .from('Justification')
        .insert([{
          id,
          employeeId,
          date: targetDate,
          type,
          description
        }])
        .select()
        .single();
      return res.json({ message: 'Justificativa adicionada', status: 'ADDED', data: created });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar justificativa: ' + error.message });
  }
});

app.get('/api/justifications', async (req, res) => {
  try {
    const { employeeId } = req.query;
    let query = supabase.from('Justification').select('*');
    if (employeeId) {
      query = query.eq('employeeId', employeeId);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar justificativas' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
