import React, { useState } from 'react';
import { trpc } from '../trpc';

const SupportTicket = () => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const mutation = trpc.support.create.useMutation();

  return (
    <div>
      <h2>Abrir Ticket de Suporte</h2>
      <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto" />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o problema..." />
      <button onClick={() => mutation.mutate({ subject, description })}>Enviar</button>
    </div>
  );
};

export default SupportTicket;
