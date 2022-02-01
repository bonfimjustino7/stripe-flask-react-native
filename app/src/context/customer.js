import React, {createContext, useContext, useState} from 'react';

const CustomerContext = createContext({
  customer: {
    id: 'id_customer',
    name: 'App Test',
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
