import React from 'react';
import { trpc } from '../../trpc';

const DriverDashboard = () => {
  const { data: profile } = trpc.driver.getProfile.useQuery();

  return (
    <div>
      <h2>Bem-vindo, Motorista</h2>
      <p>Status: {profile?.isOnline ? 'Online' : 'Offline'}</p>
      <p>Reputação: {profile?.ratingAvg?.toFixed(1)} ⭐ ({profile?.ratingCount} avaliações)</p>
      <p>Ganhos hoje: R$ 0,00 (pendente integração pagamentos)</p>
      {/* Botão aceitar corrida futura */}
    </div>
  );
};

export default DriverDashboard;
