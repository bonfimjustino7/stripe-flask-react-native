import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {API_URL} from '../Config';

export default function PlanAvaibles({navigation}) {
  const [plans, setPlans] = useState();
  const [loading, setLoading] = useState(false);

  const fetchPlans = async () => {
    const response = await fetch(`${API_URL}/plans`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const responseData = await response.json();

    return responseData.data.map(plan => {
      return {
        priceId: plan.id,
        product: plan.product.name,
      };
    });
  };

  useEffect(() => {
    async function getListPlans() {
      setLoading(true);
      const listPlans = await fetchPlans();
      setPlans(listPlans);
      setLoading(false);
    }

    getListPlans();
  }, []);

  return loading ? (
    <ActivityIndicator size="large" style={StyleSheet.absoluteFill} />
  ) : (
    <View style={styles.container}>
      <Text style={styles.textHead}>Planos disponíveis na Stripe</Text>
      <FlatList
        data={plans}
        keyExtractor={item => item.priceId}
        renderItem={({item}) => {
          console.log(item);
          return (
            // <View style={styles.row}>
            //   <Text>{item?.product}</Text>
            // </View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Payment', {
                  priceId: item.priceId,
                  product: item.product,
                })
              }
              style={styles.button}>
              <Text>{item?.product}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 30,
    backgroundColor: '#ddd',
    padding: 15,
  },
  textHead: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  container: {
    padding: 15,
  },
});
