import React, { useState } from 'react';
import { trpc } from '../trpc';

const RateRide = ({ rideId, toUserId, type }) => {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const mutation = trpc.rating.create.useMutation();

  const handleSubmit = () => {
    mutation.mutate({ rideId, toUserId, score, comment, type });
  };

  return (
    <div>
      <h2>Avalie a corrida</h2>
      <select value={score} onChange={e => setScore(Number(e.target.value))}>
        {[1,2,3,4,5].map(s => <option key={s} value={s}>{s} estrelas</option>)}
      </select>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Comentário..." />
      <button onClick={handleSubmit}>Enviar Avaliação</button>
    </div>
  );
};

export default RateRide;
