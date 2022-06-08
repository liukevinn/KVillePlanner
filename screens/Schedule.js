import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Button,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import {
  Table,
  TableWrapper,
  Col,
  Cell,
} from "react-native-table-component";

import { useFocusEffect } from "@react-navigation/native";
import * as SplashScreen from 'expo-splash-screen';
import Modal from "react-native-modal";

import { createGroupSchedule } from "../backend/CreateGroupSchedule";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const times = [ //Times for right column of the list of times of the day
  "12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am", "8am", "9am", "10am", 
  "11am", "12am", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm",
  "10pm", "11pm",
];

//Colors of each member, first is for 'null'
const colors = ['#D0342C', '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9',
  '#a4c2f4' , '#9fc5e8', '#b4a7d6', '#d5a6bd', '#e69138', '#6aa84f'];


let colorCodes = [ //Array for color corresponding to each member
  {name: 'null', color: '#D0342C'}
];


let schedule = new Array(); //GLOBAL VARIABLE for the entire group schedule

const TimeColumn = () => { //component for side table of 12am-12am time segments
  return (
    <Table>
      <Col
        data={times}
        heightArr={[
          62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62,
          62, 62, 62, 62, 62, 62, 62,
        ]} 
        textStyle={StyleSheet.flatten(styles.timesText)}
      />
    </Table>
  );
};

//function for editing the schedule based on old member and new member to replace
const editCell = (index, oldMember, newMember) =>{
  //must delete from 'schedule' and update the string within
  schedule[index] = schedule[index].replace(oldMember, newMember);
  console.log('index: ',index,'|| old: ', oldMember, '|| new: ', newMember);
  //console.log(schedule);
};


const win = Dimensions.get("window"); //Global Var for screen size

export default function Schedule({ route }) {
  const { code, tentType } = route.params; //parameters needed: groupCode and tentType
  console.log("Schedule screen params", route.params);
  const [isReady, setIsReady] = useState(false); // for checking if firebase is read before rendering
  const [isModalVisible, setModalVisible] = useState(false); //for the popup for editing a time cell
  const [isMemberModalVisible, setMemberModalVisible] = useState(false); //for the popup for choosing a member from list

  //These Hooks are for editing the group schedule
  const [newMember, setNewMember] = useState("Select a Member"); //to set the new member to replace old one
  const [oldMember, setOldMember] = useState(""); //to store which member is being replaced
  const [editIndex, setEditIndex] = useState (0); //to store which index is being edited

  const [renderDay, setRenderDay] = useState("Sunday"); //stores the current day that is being rendered
 
  /* let sunPos, monPos, tuesPos, wedPos, thurPos, friPos, satPos; //vars for autoscroll y positions
  const ref = useRef(); //creates reference for scrollView */

  const toggleModal = () => { //to toggle the edit cell popup
    setModalVisible(!isModalVisible);
  };

  const toggleMemberModal = () => { //to toggle the popup for the member list
    setMemberModalVisible(!isMemberModalVisible);
  };

  /* function autoScroll(yPos) { //for auto-scolling to certain y-position
    ref.current.scrollTo({ x: 0, y: yPos, animated: true });
  } */

  //variables to store the # of people needed for the day and night shifts
  let numberForDay, numberForNight; 

  //based on tent type, sets the number of people needed for day and night shifts
  switch (tentType) {
    case 'Black':
      numberForDay = 2;
      numberForNight = 10;
      break;
    case 'Blue':
      numberForDay = 1;
      numberForNight = 6;
      break;
    default:
      numberForDay = 1;
      numberForNight = 2;
  }

  //console.log('numberDay and Night values: ', numberForDay, numberForNight);

  /* const [dimensions, setDimensions] = useState({ win });

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ win }) => {
      setDimensions({ win });
    });
    return () => subscription?.remove();
  });

  console.log ('Dimensions: ', dimensions.win.width, 'x', dimensions.win.height); */


 //Component for the popup list of members for each member
  const Member = ({ name }) => {
    /* let indexOfUser = colorCodes.findIndex((member) =>  member.name === name);
    let backgroundColor = (indexOfUser%2 == 1) ? "#656565": "#555555"; //alternates the colors of list */
    return(
      <View>
        <TouchableOpacity 
          onPress={() => {
            setNewMember(name);
            toggleMemberModal();
        }}>
          <View style={{ backgroundColor: "#656565"}}>
            <Text
              style={{
                textAlign: "left",
                color: "white",
                marginLeft: 15,
                height: 25
              }}
            >
              {name}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  //to render flatList in member list popup
  const renderMember = ({ item }) => {
    return <Member name={item.name} />;
  };

  /* Component for each single cell timeslot 
        Parameters:
          index: index of cell within the entire schedule array
          person: string holding the person currently scheduled for the time cell
  */
  const OneCell = ({ index, person }) => {
    //changes background based on who the member is
    const indexofUser = colorCodes.findIndex((object) => object.name === person);
    const backgroundColor = colorCodes[indexofUser].color; //gets background color from the colorCodes Array
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => {
          setEditIndex(index);
          setOldMember(person);
          console.log("index: ", editIndex);
          toggleModal();
        }}>
          <View style={[styles.timeSlotBtn, {backgroundColor: backgroundColor}]}>
            <Text style={styles.btnText}>{person}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  /*Component for each row to list the people in that time shift
    # of people on the row is dependent on the tentType and time of day
      Parameters: 
        index: index of cell within the day (range from 0-47) 
        arrayIndex: index of cell in the entire schedule array (range from 0-337)
        members: string of one time shift (ex. "member1 member2 member3 member4 ")
        numDay: the number of people required for a day shift
        numNight: the number of people required for a night shift
  */
  const RenderCell = (data, index, arrayIndex, members, numDay, numNight) => {
    const people = members.split(" "); //stores the string as an array of single members
    const isNight = (index >= 2 && index <= 13);

    if (!isNight && numDay === 1) {
      return (
        <View style={styles.row}>
          <OneCell index={arrayIndex} person={people[0]} />
        </View>
      );
    } else if ((isNight && numNight === 2) || (!isNight && numDay === 2)) {
      return (
        <View style={styles.row}>
          <OneCell index={arrayIndex} person={people[0]} />
          <OneCell index={arrayIndex} person={people[1]} />
        </View>
      );
    } else if (isNight && numNight === 6) {
      return (
        <View style={styles.row}>
          <OneCell index={arrayIndex} person={people[0]} />
          <OneCell index={arrayIndex} person={people[1]} />
          <OneCell index={arrayIndex} person={people[2]} />
          <OneCell index={arrayIndex} person={people[3]} />
          <OneCell index={arrayIndex} person={people[4]} />
          <OneCell index={arrayIndex} person={people[5]} />
        </View>
      );
    } else {
      return (
        <View style={styles.row}>
          <OneCell index={arrayIndex} person={people[0]} />
          <OneCell index={arrayIndex} person={people[1]} />
          <OneCell index={arrayIndex} person={people[2]} />
          <OneCell index={arrayIndex} person={people[3]} />
          <OneCell index={arrayIndex} person={people[4]} />
          <OneCell index={arrayIndex} person={people[5]} />
          <OneCell index={arrayIndex} person={people[6]} />
          <OneCell index={arrayIndex} person={people[7]} />
          <OneCell index={arrayIndex} person={people[8]} />
          <OneCell index={arrayIndex} person={people[9]} />
        </View>
      );
    }
  };
  //Component for the table for one day's schedule
  const DailyTable = ({ numberDay, numberNight, day }) => {
    let indexAdder = 0;
    //depending on day parameter, change index in GLOBAL schedule array
    switch (day) {
      case 'Monday':
        indexAdder = 48;
        break;
      case 'Tuesday':
        indexAdder = 96;
        break;
      case 'Wednesday':
        indexAdder = 144;
        break;
      case 'Thursday':
        indexAdder = 192;
        break;
      case 'Friday':
        indexAdder = 240;
        break;
      case 'Saturday':
        indexAdder = 288;
        break;
      default:
        indexAdder=0;
    }
    let dayArr= schedule.slice(indexAdder, indexAdder+48);
    //console.log(day,"||", dayArr);
    return (
      <View style = {{marginTop: 30}}>
        <Table borderStyle={{ borderColor: "transparent" }}>
          {dayArr.map((rowData, index) => (
            <TableWrapper key={index} style={StyleSheet.flatten(styles.row)}>
              <Cell
                data={RenderCell(1, index, index+indexAdder, dayArr[index], numberDay, numberNight)}
                textStyle={StyleSheet.flatten(styles.text)}
              />
            </TableWrapper>
          ))}
        </Table>
      </View>
    );
  };

  //Component for the top day buttons
  const DayButton = ({day, abbrev}) => {
    return (
      <TouchableOpacity
        style={styles.button}
        onPress={() => setRenderDay(day)}
      >
        <Text style={styles.buttonText}>{abbrev}</Text>
      </TouchableOpacity>
    )
  };



  //Firebase reference for group
  const groupRef = firebase.firestore().collection("groupsTest").doc('BtycLIprkN3EmC9wmpaE');
  //const groupRef = firebase.firestore().collection("groups").doc(code);

  //to push changes made to schedule to firebase
  const pushEdits = () => {
    groupRef.update({
      groupSchedule: schedule
    });
  };

  //to read the current schedule from firebase
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      async function prepare() {
        try {
          await SplashScreen.preventAutoHideAsync();

          //stores group schedule in global variable
          await groupRef.get().then((doc) => {
            schedule = doc.data().groupSchedule;
          });

          await groupRef
            .collection('members')
            .get()
            .then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                //stores each member in colorCodes array

                let currName = doc.data().name; //gets current name in list
                let current = {
                  //create new object for the current list item
                  name: currName,
                  color: '',
                };
                let nameExists;
                if (colorCodes.length === 0) nameExists = false;
                else {
                  nameExists = colorCodes.some((e) => e.name === currName);
                }

                if (!nameExists) {
                  // if not already in the colorCodes array, add to the array
                  colorCodes.push(current);
                }
              });
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
      return () => {
        mounted = false;
      };
    }, [])
  );

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);
  
  if (!isReady ) {     //if firebase reading done, then render
    return null;
  } 
  //console.log('Full Schedule: ', schedule);

  //initializes the colorCodes fso each member has a unique color background
  for (let index = 0; index < colorCodes.length ; index++){ 
    colorCodes[index].color = colors[index];
  }

  return (
    <View style={styles.bigContainer} onLayout={onLayoutRootView}>
      <View>
        <Modal 
          isVisible={isModalVisible}
          onBackdropPress={() => setModalVisible(false)}
        >
          <View style={styles.deletePopup}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "500",
                textAlign: "center",
                borderBottomWidth: 1,
                height: win.height * 0.05,
                width: "100%"
            }}>
              Edit Timeslot
            </Text>

            <TouchableOpacity onPress={toggleMemberModal} >
              <View style = 
              {{
                //backgroundColor: "#f2f2f2",
                height: win.height * 0.06,
                width: "100%",
                alignSelf: "center",
                justifyContent: "center"
              }}>
                <Text style=
                {{ textAlign: "center", fontSize: 20  }}>{newMember}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress= {() => {
              if (newMember == "Select a Member") {toggleModal()}
              else{
                toggleModal();
                editCell(editIndex, oldMember, newMember);
              }
            }}>
              <View style = {{
                backgroundColor: "#636363",
                height: win.height * 0.06,
                justifyContent: "center"
              }}>
                <Text
                  style={{
                    textAlign: "center",
                    color: "white",
                    fontSize: 24,
                    fontWeight: "500"
                  }}>
                    Edit
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      </View> 


      <View>
      <Modal
        isVisible={isMemberModalVisible}
        onBackdropPress={() => setMemberModalVisible(false)}
        //customBackdrop={<View style={{ flex: 1 }} />}
      >
        <View
          style={{
            width: "50%",
            borderWidth: 1,
            //marginTop:win.height *.38 -  25*7,
            marginTop: win.height * 0.3
          }}
        >
          <View>
            <FlatList
              data={colorCodes}
              renderItem={renderMember}
              keyExtractor={(item) => item.color}
            />
          </View>
        </View>
      </Modal>
      </View>

      <View>
        <View style={styles.buttonContainer}>
          <DayButton day = "Sunday" abbrev="Sun"/>
          <DayButton day = "Monday" abbrev="Mon"/>
          <DayButton day = "Tuesday" abbrev="Tue"/>
          <DayButton day = "Wednesday" abbrev="Wed"/>
          <DayButton day = "Thursday" abbrev="Thur"/>
          <DayButton day = "Friday" abbrev="Fri"/>
          <DayButton day = "Saturday" abbrev="Sat"/>
        </View>

        <View style = {[styles.buttonContainer, styles.shadowProp]}>
          <TouchableOpacity onPress={pushEdits}>
            <View style ={[styles.topEditBtn,{backgroundColor: "#5d5d5d"}]}>
              <Text style={[styles.topEditBtnText,{color: "white"}]}>Push Changes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              createGroupSchedule(code, tentType).then(
                (groupSchedule) => {
                  console.log("Group Schedule", groupSchedule);

                  groupRef
                    .set({
                      groupSchedule: groupSchedule,
                    });
                }
              );
            }}>
            <View style ={[styles.topEditBtn,{backgroundColor: "#c9c9c9"}]}>
              <Text style={styles.topEditBtnText}>Create New Schedule</Text>
            </View>
          </TouchableOpacity>
            
        </View>
      </View>


      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dayHeader}>
          {renderDay}
        </Text>
        <View style={{ flexDirection: "row" }}>
          <TimeColumn />
          <DailyTable numberDay={numberForDay} numberNight={numberForNight} day={renderDay} />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bigContainer: { flex: 1, backgroundColor: "#C2C6D0" }, //for the entire page's container
  text: { margin: 3 }, //text within cells
  timesText: {   //text style for the side text of the list of times
    fontWeight: "800",
    fontSize: 9,
    //marginRight:6,
    width: win.width * 0.10,
    textAlign: "center",
  },
  buttonContainer: { //container for the top buttons
    //flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: { //for the day buttons at top of screen
    backgroundColor: "#e5e5e5",
    width: win.width/7,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { //text for day buttons
    fontSize: "auto",
    fontWeight: "500",
    textAlign: "center",
    color: "black",
  },
  topEditBtn:{
    width: win.width*0.5,
    backgroundColor: "white",
    justifyContent: "center",
    height: 40

  },
  topEditBtnText:{
    textAlign:"center",
    fontSize: 16,
    fontWeight: "500"
  },
  dayHeaderBox: { //NOT IN USE RN
    backgroundColor: '#e5e5e5',
    width: "",
    height: 60,
    borderRadius: 8,
    textAlign: "center",
    justifyContent: "center"
  },
  dayHeader: {  //text for the header for the day
    marginTop: 20,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  row: { //style for one row of the table
    flexDirection: "row",
    backgroundColor: "lavender",
    width: win.width * .88,
    height: 31,
    alignItems: "center",
    borderBottomColor: 'black',
    borderBottomWidth: 1
  },
  timeSlotBtn: { //Button for oneCell of the Table
    //width: 58,
    height: 30,
    backgroundColor: "#78B7BB",
    //borderRadius: 2,
    alignSelf: "stretch",
    justifyContent: "center"
  },
  btnText: { //Text within one cell button
    textAlign: "center", 
    color: "black", 
    fontWeight: "500", 
    fontSize: 10 
  },
  shadowProp: { //shadows to apply
    shadowColor: '#171717',
    shadowOffset: {width: -3, height: 5},
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  deletePopup: { //style for the bottom screen popup for editing a cell
    alignSelf: "center",
    flexDirection: "column", 
    justifyContent: "space-between",
    marginTop: win.height * .83,
    width: win.width,
    height: win.height * 0.17,
    backgroundColor: "#C2C6D0"
  }
});





/* //TEST GROUP
let group = [
  "poop1", "poop2", "poop0 poop5 poop2 poop11 poop1 TrueAlways ", "poop0 poop5 poop2 poop11 poop1 TrueAlways ", 
  "poop0 poop5 poop2 poop11 poop1 TrueAlways ", "poop0 poop5 poop2 poop11 poop1 TrueAlways ",
  "poop0 poop5 poop2 poop11 poop1 TrueAlways ", "poop0 poop5 poop2 poop11 poop1 TrueAlways ",
  "poop0 poop5 poop2 poop11 poop1 TrueAlways ", "poop0 poop5 poop2 poop11 poop1 TrueAlways ",
  "poop0 poop5 poop2 poop11 poop1 TrueAlways ", "poop0 poop5 poop2 poop11 poop1 TrueAlways ",
  "poop0 poop5 poop2 poop11 poop1 TrueAlways ", "poop0 poop5 poop2 poop11 poop1 TrueAlways ",
  "null",
];  *



  //const groupRef = firebase.firestore().collection("groups").doc(code);

  /* <Text
            style={styles.dayHeader}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              sunPos = layout.y;
            }}
          >
            {" "}
            SUNDAY{" "}
          </Text>

          <View style={{ flexDirection: "row" }}>
            <TimeColumn />
            <DailyTable numberDay={numberForDay} numberNight={numberForNight} day='Sunday' />
          </View>

          <Text
            style={[styles.dayHeader, styles.dayHeaderBox]}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              monPos = layout.y;
            }}
          >
            {" "}
            MONDAY{" "}
          </Text>
          <View style={{ flexDirection: "row" }}>
            <TimeColumn />
            <DailyTable numberDay={numberForDay} numberNight={numberForNight} day='Monday' />
          </View>

          <Text
            style={styles.dayHeader}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              tuesPos = layout.y;
            }}
          >
            {" "}
            TUESDAY{" "}
          </Text>
          <View style={{ flexDirection: "row" }}>
            <TimeColumn />
            <DailyTable numberDay={numberForDay} numberNight={numberForNight} day='Tuesday' />
          </View>

          <Text
            style={styles.dayHeader}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              wedPos = layout.y;
            }}
          >
            {"    "}
            WEDNESDAY{" "}
          </Text>
          <View style={{ flexDirection: "row" }}>
            <TimeColumn />
            <DailyTable  numberDay={numberForDay} numberNight={numberForNight} day='Wednesday'/>
          </View>

          <Text
            style={styles.dayHeader}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              thurPos = layout.y;
            }}
          >
            {" "}
            THURSDAY{" "}
          </Text>
          <View style={{ flexDirection: "row" }}>
            <TimeColumn />
            <DailyTable  numberDay={numberForDay} numberNight={numberForNight} day='Thursday'/>
          </View>

          <Text
            style={styles.dayHeader}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              friPos = layout.y;
            }}
          >
            {" "}
            FRIDAY{" "}
          </Text>
          <View style={{ flexDirection: "row" }}>
            <TimeColumn />
            <DailyTable  numberDay={numberForDay} numberNight={numberForNight} day='Friday'/>
          </View>

          <Text
            style={styles.dayHeader}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              satPos = layout.y;
            }}
          >
            {" "}
            SATURDAY{" "}
          </Text>
          <View style={{ flexDirection: "row" }}>
            <TimeColumn />
            <DailyTable  numberDay={numberForDay} numberNight={numberForNight} day='Saturday'/>
          </View> */

          /* <View style={[styles.buttonContainer, styles.shadowProp]}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => autoScroll(sunPos)}
          >
            <Text style={styles.buttonText}>Sun</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => autoScroll(monPos)}
          >
            <Text style={styles.buttonText}>Mon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => autoScroll(tuesPos)}
          >
            <Text style={styles.buttonText}>Tues</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => autoScroll(wedPos)}
          >
            <Text style={styles.buttonText}>Wed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => autoScroll(thurPos)}
          >
            <Text style={styles.buttonText}>Thur</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => autoScroll(friPos)}
          >
            <Text style={styles.buttonText}>Fri</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => autoScroll(satPos)}
          >
            <Text style={styles.buttonText}>Sat</Text>
          </TouchableOpacity>
        </View> */