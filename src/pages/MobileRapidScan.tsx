import { RapidScanMode } from '@/components/mobile/RapidScanMode';
import { useNavigate } from 'react-router-dom';

export default function MobileRapidScan() {
  const navigate = useNavigate();

  return (
    <RapidScanMode
      open={true}
      onClose={() => navigate('/mobile')}
      onValidate={(items) => {
        console.log('Validating items:', items);
        // TODO: Implement checkout logic
        navigate('/mobile/cash-register');
      }}
      onAssociateCustomer={() => {
        // TODO: Implement customer selection
        console.log('Associate customer');
      }}
    />
  );
}
