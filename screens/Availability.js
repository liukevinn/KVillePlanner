import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Table,
  TableWrapper,
  Row,
  Col,
  Cell,
} from 'react-native-table-component';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from 'react-native-modal';
import RNPickerSelect from 'react-native-picker-select';
import { Picker } from '@react-native-picker/picker';
import * as SplashScreen from 'expo-splash-screen';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const window = Dimensions.get('window');

// prettier-ignore
const agenda = {
  tableHead: ['', 'Sun', 'Mon', 'Tu', 'Wed', 'Th', 'Fri', 'Sat'],
  tableTime: ['12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM','8 AM', '9 AM', '10 AM', '11 AM', '12 PM',' 1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM',],
};

//const tableData = Array.from(Array(24).fill(""), () => new Array(7).fill(""));
const tableData = [];
for (let i = 0; i < 48; i += 1) {
  const rowData = [];
  for (let j = 0; j < 7; j += 1) {
    rowData.push('');
  }
  tableData.push(rowData);
}

let availability;
let currIndex;

export default function Availability({ route }) {
  const { groupCode } = route.params;
  console.log('availability params', route.params);

  const [isReady, setIsReady] = useState(false);
  const [dimensions, setDimensions] = useState({ window });
  const [isModalVisible, setModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [startTime, setStartTime] = useState({
    hour: 0,
    minute: 0,
    day: 0,
  });
  const [endTime, setEndTime] = useState({
    hour: 0,
    minute: 0,
    day: 0,
  });

  const memberRef = firebase
    .firestore()
    .collection('groups')
    .doc(groupCode)
    .collection('members')
    .doc(firebase.auth().currentUser.uid);

  const updateAvailability = () => {
    let startIdx =
      parseInt(selectedDay) * 48 +
      parseInt(startTime.day) +
      parseInt(startTime.minute) +
      parseInt(startTime.hour) * 2;
    let endIdx =
      parseInt(selectedDay) * 48 +
      parseInt(endTime.day) +
      parseInt(endTime.minute) +
      parseInt(endTime.hour) * 2;
    for (let i = startIdx; i < endIdx; i++) {
      availability[i] = false;
    }
    console.log('availability', availability);
    memberRef.update({
      availability: availability,
    });
    toggleModal();
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  const toggleDeleteModal = () => {
    setDeleteModalVisible(!isDeleteModalVisible);
  };

  const element = (data, index) => (
    <TouchableOpacity
      style={styles.btn}
      onPress={() => {
        console.log(index);
        toggleDeleteModal();
        currIndex = index;
      }}
    ></TouchableOpacity>
  );

  const deleteCell = () => {
    console.log(currIndex);
    availability[currIndex] = true;
    memberRef.update({
      availability: availability,
    })
    toggleDeleteModal();
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ window });
    });
    return () => subscription?.remove();
  });

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      async function prepare() {
        try {
          await SplashScreen.preventAutoHideAsync();

          await memberRef.get().then((doc) => {
            availability = doc.data().availability;
          });
        } catch (e) {
          console.warn(e);
        } finally {
          // Tell the application to render
          setIsReady(true);
        }
      }
      if (mounted) {
        prepare();
      }
      return () => (mounted = false);
    }, [])
  );

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }
  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <View>
        <Modal
          animationType='slide'
          visible={isDeleteModalVisible}
          onBackdropPress={toggleDeleteModal}
        >
          <View
            style={{
              position: 'absolute',
              alignSelf: 'center',
              flexDirection: 'column',
              justifyContent: 'center',
              backgroundColor: '#C2C6D0',
              shadowColor: '#171717',
              shadowOffset: { width: 0, height: -5 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 5,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              width: window.width,
              height: window.height * 0.1,
              marginTop: window.height * 0.9,
            }}
          >
            <TouchableOpacity onPress={deleteCell}>
              <Text style={{ textAlign: 'center' }}>Delete Cell</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>

      <Modal
        animationType='slide'
        visible={isModalVisible}
        onBackdropPress={toggleModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.headerText}>Add New Busy Time</Text>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.selectDay}>
              <Text>Day: </Text>
              <RNPickerSelect
                onValueChange={(value) => setSelectedDay(value)}
                placeholder={{ label: 'Select a day...', value: null }}
                style={pickerSelectStyles}
                items={[
                  { label: 'Monday', value: 1 },
                  { label: 'Tuesday', value: 2 },
                  { label: 'Wednesday', value: 3 },
                  { label: 'Thursday', value: 4 },
                  { label: 'Friday', value: 5 },
                  { label: 'Saturday', value: 6 },
                  { label: 'Sunday', value: 7 },
                ]}
              />
            </View>
            <Text>Start Time: </Text>
            <View style={styles.selectTime}>
              <Picker
                selectedValue={startTime.hour}
                onValueChange={(itemValue, itemIndex) => {
                  setStartTime({ ...startTime, hour: itemValue });
                }}
                style={
                  Platform.OS === 'ios'
                    ? styles.picker
                    : { height: 30, width: '30%' }
                }
                itemStyle={Platform.OS === 'ios' ? styles.pickerItem : {}}
              >
                <Picker.Item label='12' value={0} />
                <Picker.Item label='1' value={1} />
                <Picker.Item label='2' value={2} />
                <Picker.Item label='3' value={3} />
                <Picker.Item label='4' value={4} />
                <Picker.Item label='5' value={5} />
                <Picker.Item label='6' value={6} />
                <Picker.Item label='7' value={7} />
                <Picker.Item label='8' value={8} />
                <Picker.Item label='9' value={9} />
                <Picker.Item label='10' value={10} />
                <Picker.Item label='11' value={11} />
              </Picker>
              <Picker
                selectedValue={startTime.minute}
                onValueChange={(itemValue, itemIndex) => {
                  setStartTime({ ...startTime, minute: itemValue });
                }}
                style={
                  Platform.OS === 'ios'
                    ? styles.picker
                    : { height: 30, width: '30%' }
                }
                itemStyle={Platform.OS === 'ios' ? styles.pickerItem : {}}
              >
                <Picker.Item label='00' value={0} />
                <Picker.Item label='30' value={1} />
              </Picker>
              <Picker
                selectedValue={startTime.day}
                onValueChange={(itemValue, itemIndex) => {
                  setStartTime({ ...startTime, day: itemValue });
                }}
                style={
                  Platform.OS === 'ios'
                    ? styles.picker
                    : { height: 30, width: '30%' }
                }
                itemStyle={Platform.OS === 'ios' ? styles.pickerItem : {}}
              >
                <Picker.Item label='AM' value={0} />
                <Picker.Item label='PM' value={24} />
              </Picker>
            </View>
            <Text>End Time: </Text>
            <View style={styles.selectTime}>
              <Picker
                selectedValue={endTime.hour}
                onValueChange={(itemValue, itemIndex) => {
                  setEndTime({ ...endTime, hour: itemValue });
                }}
                style={
                  Platform.OS === 'ios'
                    ? styles.picker
                    : { height: 30, width: '30%' }
                }
                itemStyle={Platform.OS === 'ios' ? styles.pickerItem : {}}
              >
                <Picker.Item label='12' value={0} />
                <Picker.Item label='1' value={1} />
                <Picker.Item label='2' value={2} />
                <Picker.Item label='3' value={3} />
                <Picker.Item label='4' value={4} />
                <Picker.Item label='5' value={5} />
                <Picker.Item label='6' value={6} />
                <Picker.Item label='7' value={7} />
                <Picker.Item label='8' value={8} />
                <Picker.Item label='9' value={9} />
                <Picker.Item label='10' value={10} />
                <Picker.Item label='11' value={11} />
              </Picker>
              <Picker
                selectedValue={endTime.minute}
                onValueChange={(itemValue, itemIndex) => {
                  setEndTime({ ...endTime, minute: itemValue });
                }}
                style={
                  Platform.OS === 'ios'
                    ? styles.picker
                    : { height: 30, width: '30%' }
                }
                itemStyle={Platform.OS === 'ios' ? styles.pickerItem : {}}
              >
                <Picker.Item label='00' value={0} />
                <Picker.Item label='30' value={1} />
              </Picker>
              <Picker
                selectedValue={endTime.day}
                onValueChange={(itemValue, itemIndex) => {
                  setEndTime({ ...endTime, day: itemValue });
                }}
                style={
                  Platform.OS === 'ios'
                    ? styles.picker
                    : { height: 30, width: '30%' }
                }
                itemStyle={Platform.OS === 'ios' ? styles.pickerItem : {}}
              >
                <Picker.Item label='AM' value={0} />
                <Picker.Item label='PM' value={24} />
              </Picker>
            </View>
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={updateAvailability}
            >
              <Text style={styles.btnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Table borderStyle={{ borderWidth: 1 }}>
        <Row
          data={agenda.tableHead}
          style={StyleSheet.flatten(styles.head)}
          textStyle={StyleSheet.flatten(styles.text)}
        />
      </Table>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Table
          borderStyle={{ borderWidth: 1 }}
          style={{ flexDirection: 'row' }}
        >
          <TableWrapper style={{ width: dimensions.window.width / 8 }}>
            <Col
              data={agenda.tableTime}
              style={StyleSheet.flatten(styles.time)}
              textStyle={StyleSheet.flatten(styles.text)}
            />
          </TableWrapper>
          <TableWrapper style={{ flex: 1 }}>
            {tableData.map((rowData, index) => (
              <TableWrapper
                key={index}
                style={[
                  styles.row,
                  index % 2 && { backgroundColor: '#F7F6E7' },
                ]}
              >
                {rowData.map((cellData, cellIndex) => (
                  <Cell
                    key={cellIndex}
                    data={
                      availability[48 * cellIndex + index]
                        ? cellData
                        : element(cellData, 48 * cellIndex + index)
                    }
                    textStyle={StyleSheet.flatten(styles.text)}
                  />
                ))}
              </TableWrapper>
            ))}
          </TableWrapper>
        </Table>
      </ScrollView>
      <View
        style={[styles.addContainer, { width: dimensions.window.width / 8 }]}
      >
        <TouchableOpacity onPress={toggleModal}>
          <Icon name={'plus-circle'} color={'#1F509A'} size={40} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    //backgroundColor: '#C2C6D0',
  },
  row: {
    height: 40,
    backgroundColor: '#E7E6E1',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '80%',
    borderRadius: 25,
    borderWidth: 1,
    borderStyle: 'solid',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    //borderWidth: 1,
  },
  headerText: {
    fontSize: 20,
  },
  modalBody: {
    alignItems: 'center',
    width: '100%',
    height: '80%',
    justifyContent: 'space-evenly',
  },
  picker: {
    height: '100%',
    width: '35%',
  },
  pickerItem: {
    height: '100%',
  },
  selectDay: {
    alignItems: 'center',
    width: '70%',
    height: '20%',
  },
  selectTime: {
    //flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    height: '30%',
    width: '90%',
  },
  modalFooter: {
    width: '100%',
    height: '10%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: '95%',
    height: '50%',
    backgroundColor: '#1F509A',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
  },
  cell: {
    height: 40,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    margin: 0,
  },
  btn: {
    //margin: 0,
    width: '95%',
    height: 42,
    backgroundColor: '#1F509A',
    borderRadius: 5,
    alignSelf: 'center',
  },
  addContainer: {
    position: 'absolute',
    backgroundColor: '#00000000',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    right: 0,
    bottom: 0,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'purple',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
});
