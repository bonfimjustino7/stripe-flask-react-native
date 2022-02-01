import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Button,
  ActivityIndicator,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {API_URL} from '../Config';
import {useCustomer} from '../context/customer';
import {useFocusEffect} from '@react-navigation/native';

export default function HomeScreen({navigation}) {
  const [subscriptions, setSubscriptions] = useState();
  const [loading, setLoading] = useState(false);
  const {customer} = useCustomer();

  const fetchSubscriptions = async () => {
    const response = await fetch(
      `${API_URL}/customer/${customer.id}/subscriptions`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const responseData = await response.json();

    return responseData?.data
      ?.filter(sub => sub.status === 'active')
      .map(sub => {
        return {
          id: sub.id,
          product: sub.plan.product.name,
        };
      });
  };

  useFocusEffect(
    useCallback(() => {
      async function getListPlans() {
        setLoading(true);
        const listPlans = await fetchSubscriptions();
        setSubscriptions(listPlans);
        setLoading(false);
      }

      getListPlans();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigation]),
  );

  return loading ? (
    <ActivityIndicator size="large" style={StyleSheet.absoluteFill} />
  ) : (
    <View style={styles.container}>
      <Text style={styles.textHead}>Planos contratados</Text>
      <FlatList
        data={subscriptions}
        keyExtractor={item => item.id}
        ListEmptyComponent={() => {
          return (
            <View style={styles.viewEmpty}>
              <Text>Nenhum plano cadastrado</Text>
            </View>
          );
        }}
        renderItem={({item}) => {
          return (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Payment', {
                  subscriptionId: item.id,
                  name: item.product,
                })
              }
              style={styles.button}>
              <Text>{item?.product}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.viewPay}>
        <Button
          onPress={() => navigation.navigate('PlanList')}
          title="Assinar novo"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 30,
    backgroundColor: '#ccc',
    padding: 15,
  },
  textHead: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  container: {
    padding: 15,
  },
  viewPay: {
    marginTop: 20,
  },
  viewEmpty: {
    marginVertical: 20,
  },
});
