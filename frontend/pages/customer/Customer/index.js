import { useEffect, useState } from 'react';
import { getCustomerPrefix } from '../../../utils/utils';
import Header from './Header';
import ProgramIsActive from './ProgramIsActive';
import ProgramNotActive from './ProgramNotActive';
import Welcome from './Welcome';
import { useRouter } from 'next/router';
import PageBackground from '../../../components/PageBackground';
import { backend } from '../../../utils/backend';
import { factory } from '../../../utils/near-ft-factory';
import { customer } from '../../../utils/customer';

const CustomerView = () => {
  const router = useRouter();
  const merchantAddress = router.query.program;

  const [programExists, setProgramExists] = useState(false);
  const [ftMetadata, setFtMetadata] = useState({});
  const [isProgramActive, setIsProgramActive] = useState(false);
  const [customerBalance, setCustomerBalance] = useState();
  const [customerUuid, setCustomerUuid] = useState('');
  const [programsList, setProgramsList] = useState([]);

  // TODO: instead of calling backend directly, create a frontend class that will handle backend - it will be much clearer logically
  useEffect(() => {
    const checkSignIn = async () => {
      await backend.startUp();
      const isProgramActive = !!backend.checkIsProgramActive();

      setLoader(false);
      setIsProgramActive(isProgramActive);
    };

    checkSignIn();
  }, []);

  function purchaseWithCC(e) {
    customer
      .purchaseCoffeeWithCC()
      .then(() => alert('Coffee bought with Credit Card'))
      .then(() => customer.getBalance().then((b) => setCustomerBalance(b)))
      .catch(alert)
      .catch(alert);
  }

  async function purchaseWithTokens(e) {
    customer
      .purchaseCoffeeWithTokens()
      .then(() => alert('Coffee bought with tokens'))
      .then(() => customer.getBalance().then((b) => setCustomerBalance(b)))
      .catch(alert)
      .catch(alert);
  }

  useEffect(() => {
    if (!isProgramActive || !merchantAddress) {
      return;
    }

    setCustomerUuid(getCustomerPrefix());
    factory.checkProgramExists(merchantAddress).then((programExists) => {
      setProgramExists(programExists);
    });
  }, [isProgramActive, merchantAddress]);

  useEffect(() => {
    factory.getAllPrograms().then((res) => {
      setProgramsList(res);
    });
  }, [isProgramActive]);

  useEffect(() => {
    if (!programExists) {
      return;
    }

    factory
      .getProgram(merchantAddress)
      .then((metadata) => {
        setFtMetadata(metadata.ft);
      })
      .then(() => customer.getBalance().then((b) => setCustomerBalance(b)))
      .catch(alert);
  }, [merchantAddress, programExists]);

  const product = {
    name: 'Large Coffe',
    fiatCost: '$9.99',
    tokenCost: 30,
    tokensPerUnit: 10,
  };

  const canCollect = customerBalance >= product.tokenCost;
  const programIsActive = !!ftMetadata.account_id;

  return (
    !loader && (
      <PageBackground variant="customer" header={<Header />}>
        <Welcome ftMetadata={ftMetadata} programIsActive={programIsActive} merchantAddress={merchantAddress} />
        {programIsActive && (
          <ProgramIsActive
            ftMetadata={ftMetadata}
            product={product}
            customerUuid={customerUuid}
            customerBalance={customerBalance}
            purchaseWithCC={purchaseWithCC}
            canCollect={canCollect}
            purchaseWithTokens={purchaseWithTokens}
          />
        )}
        {programIsActive || <ProgramNotActive programsList={programsList} />}
      </PageBackground>
    )
  );
};

export default CustomerView;
