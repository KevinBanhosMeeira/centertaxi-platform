import React from 'react';
import { trpc } from '../trpc'; // Seu client tRPC

interface PayRideProps {
  rideId: string;
  methodId: string;
}

const PayRide: React.FC<PayRideProps> = ({ rideId, methodId }) => {
  const { mutate, isLoading, data, error } = trpc.payment.payRide.useMutation();

  const handlePay = () => mutate({ rideId, methodId });

  return (
    <div>
      <button disabled={isLoading} onClick={handlePay}>
        {isLoading ? 'Processando...' : 'Pagar Corrida'}
      </button>
      {error && <p>Erro: {error.message}</p>}
      {data?.qrCode && (
        <div>
          <p>PIX: Copie ou escaneie</p>
          <img src={`data:image/png;base64,${data.qrCodeBase64}`} alt="QR Code PIX" />
          <p>{data.qrCode}</p>
        </div>
      )}
      {data?.status === 'PAID' && <p>Pagamento aprovado!</p>}
    </div>
  );
};

export default PayRide;
