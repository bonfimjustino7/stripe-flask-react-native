import React, {createContext, useContext, useState} from 'react';

const CustomerContext = createContext({
  customer: {
    id: 'cus_L2icM86gIjXtf7',
    name: 'Medflow App',
  },
  setCustomer: () => {},
});

export const CustomerProvider = ({children}) => {
  const [customer, setCustomer] = useState(null);

  return (
    <CustomerContext.Provider value={{customer, setCustomer}}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => useContext(CustomerContext);
