import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [records, setRecords] = useState([]);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [running, setRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [iteration, setIteration] = useState(1);
  const [previousEnd, setPreviousEnd] = useState(null);

  useEffect(() => {
    let interval;
    if (running) {
      interval = setInterval(() => {
        setTimeElapsed(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [running]);

  const handleStartStop = () => {
    if (!running) {
      console.log("Iniciando contador...");
      setStart(new Date());
      setEnd(null);
      setTimeElapsed(0);
    } else {
      console.log("Deteniendo contador...");
      setEnd(new Date());
      const newRecord = {
        iteration: iteration,
        startTime: start,
        endTime: end || new Date(), // Si 'end' es null, utiliza la hora actual
        elapsedTime: timeElapsed,
      };
      newRecord.interarrivalTime = calculateInterarrivalTime(previousEnd, newRecord.startTime);
      console.log("Nuevo registro:", newRecord);
      setRecords(prevRecords => [...prevRecords, newRecord]);
      setIteration(iteration + 1);
      setPreviousEnd(newRecord.endTime); // Actualizamos previousEnd con el endTime del nuevo registro
    }
    setRunning(!running);
  };

  const calculateInterarrivalTime = (previousEnd, startTime) => {
    if (previousEnd && startTime) {
      return (startTime - previousEnd) / 1000; // Devolvemos la diferencia en segundos
    }
    return 0;
};

  const exportToCSV = async () => {
    try {
      const csvContent = records.map(record => `${record.iteration},${record.startTime},${record.endTime},${record.elapsedTime},${record.interarrivalTime}`).join('\n');
      const path = FileSystem.documentDirectory + 'records.csv';
      await FileSystem.writeAsStringAsync(path, 'iteracion,F/H inicio,F/H fin,tiempo transcurrido, tiempo interarribo\n' + csvContent);
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Share.share({
          message: 'Exportación de registros CSV',
          url: 'file://' + path,
        });
      } else {
        alert('La exportación de registros CSV está disponible solo en dispositivos iOS y Android.');
      }
    } catch (error) {
      console.error('Error al exportar registros a CSV:', error);
      alert('Error al exportar registros a CSV. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleStartStop}>
        <Text style={styles.buttonText}>{running ? 'Detener' : 'Iniciar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.exportButton} onPress={exportToCSV}>
        <Text style={styles.exportButtonText}>Exportar a CSV</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});