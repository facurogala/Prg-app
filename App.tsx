import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Importamos LinearGradient

const App: React.FC = () => {
  // Estados para los inputs y el 1RM
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [oneRepMax, setOneRepMax] = useState<number | null>(null);

  // Función para calcular el 1RM
  const calculateOneRepMax = (weight: string, reps: string) => {
    const weightNum = parseFloat(weight);
    const repsNum = parseFloat(reps);

    if (!isNaN(weightNum) && !isNaN(repsNum) && repsNum > 0) {
      const oneRM = weightNum * (1 + 0.0333 * repsNum);
      setOneRepMax(oneRM);
    } else {
      setOneRepMax(null);
    }
  };

  // Función para calcular los RM del 1 al 16 (4x4)
  const calculateRMs = () => {
    if (!oneRepMax) return [];

    const rms = [];
    for (let i = 1; i <= 16; i++) {
      const rm = oneRepMax / (1 + 0.0333 * i);
      rms.push({ reps: i, weight: rm.toFixed(2) });
    }
    return rms;
  };

  // Renderizar cada item de la cuadrícula
  const renderItem = ({ item }: { item: { reps: number; weight: string } }) => (
    <View style={styles.gradientBox}>
      <LinearGradient
        colors={['#737373', '#272729']}
        start={{ x: 0, y: -1 }} 
        end={{ x: 1, y: 0 }} 
        style={styles.gradientBackground}
      >
        <View style={styles.rmItem}>
          <Text style={styles.rmRepsText}>{item.reps} RM</Text>
          <Text style={styles.rmWeightText}>{item.weight} kg</Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Inputs para peso y repeticiones */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Kilos"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={weight}
          onChangeText={(text) => {
            setWeight(text);
            calculateOneRepMax(text, reps);
          }}
        />
        <View style={styles.divider} />
        <TextInput
          style={styles.input}
          placeholder="Repes"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={reps}
          onChangeText={(text) => {
            setReps(text);
            calculateOneRepMax(weight, text);
          }}
        />
      </View>

      {/* Mostrar el 1RM calculado */}
      {oneRepMax !== null && (
        <Text style={styles.oneRepMaxText}>
          1RM: {oneRepMax.toFixed(2)} kg
        </Text>
      )}

      {/* Cuadrícula de RM */}
      <FlatList
        data={calculateRMs()}
        renderItem={renderItem}
        keyExtractor={(item) => item.reps.toString()}
        numColumns={4} // 4 columnas
        contentContainerStyle={styles.rmGrid}
      />
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#161616', // Fondo de la app
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#272729', // Borde de los inputs
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#272729', // Fondo de los inputs
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#fff', // Color del texto de los inputs
  },
  divider: {
    width: 1,
    backgroundColor: '#444', // Color del divisor
  },
  oneRepMaxText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff', // Color del texto del 1RM
  },
  rmGrid: {
    marginTop: 20,
  },
  gradientBox: {
    flex: 1,
    margin: 5,
    aspectRatio: 1, // Para que sea un cuadrado
    borderRadius: 16, // Bordes redondeados
    overflow: 'hidden', // Asegura que el degradado no se desborde
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rmItem: {
    width: '96%',
    height: '96%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#272729', // Fondo del cuadrado
    borderRadius: 14, // Bordes redondeados ligeramente más pequeños que el contenedor
  },
  rmRepsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff', // Color del texto de las repeticiones
  },
  rmWeightText: {
    fontSize: 14,
    color: '#fff', // Color del texto del peso
  },
});

export default App;