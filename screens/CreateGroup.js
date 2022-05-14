import React, { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ImageBackground,
} from "react-native";
import zion from "../assets/zion.png";
import { Picker } from "@react-native-picker/picker";

import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

import { generateGroupCode } from "../backend/GroupCode";

require("firebase/firestore");

const styles = StyleSheet.create({
  groupContainer: {
    flexDirection: "column",
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1f509a",
  },
  backgroundImage: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    resizeMode: "cover",
  },
  textContainer: {
    height: "70%",
    width: "80%",
    marginVertical: 50,
    //justifyContent: "space-between"
  },
  text: {
    color: "#fff",
    //fontFamily: "Open Sans",
    fontSize: 22,
    fontWeight: "700",
  },
  centerText: {
    color: "#fff",
    //fontFamily: "Open Sans",
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
  },
  textInput: {
    height: "5%",
    textAlign: "center",
    backgroundColor: "#FFFAFACC",
    borderRadius: 15,
    //placeholderTextColor: "#897F7FCC",
  },
  btnContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
  },
  cancelBtn: {
    borderRadius: 30,
    backgroundColor: "#000",
    padding: 15,
    width: "45%",
  },
  createBtn: {
    borderRadius: 30,
    backgroundColor: "#1F509A",
    padding: 15,
    width: "45%",
  },
  btnTxt: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 36,
    textAlign: "center",
  },
});

export default function CreateGroup({ navigation }) {
  const [name, setName] = useState("");
  const [tentType, setTentType] = useState("");
  const [groupCode, setGroupCode] = useState(generateGroupCode(8));
  const [groupRole, setGroupRole] = useState("");

  const onCreateGroup = () => {
    //setGroupCode(generateGroupCode(10));

    firebase.firestore().collection("groups").doc(groupCode).set({
      name,
      tentType,
    });
    firebase
      .firestore()
      .collection("groups")
      .doc(groupCode)
      .collection("members")
      .doc(firebase.auth().currentUser.uid)
      .set({
        groupRole,
      });
    firebase
      .firestore()
      .collection("users")
      .doc(firebase.auth().currentUser.uid)
      .update({
        groupCode: groupCode,
        inGroup: true,
      });
  };

  return (
    <View style={styles.groupContainer}>
      <ImageBackground source={zion} style={styles.backgroundImage}>
        <View style={styles.textContainer}>
          <Text style={styles.text}>Group Name:</Text>

          <TextInput
            style={styles.textInput}
            placeholder="Enter Group Name"
            onChangeText={(name) => setName(name)}
          />

          <Text style={styles.centerText}>Group Code</Text>
          <View
            style={{
              backgroundColor: "#FFFAFA90",
              //height: "15%",
              alignContent: "center",
              flexDirection: "row",
              flex: 0.2,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 30,
                fontWeight: "bold",
                flex: 1,
              }}
            >
              {groupCode}
            </Text>
          </View>
        </View>
        <View style={styles.btnContainer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.btnTxt}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => {
              //setGroupCode(generateGroupCode(10));
              onCreateGroup();
              console.log(groupCode);
              // firebase
              //   .firestore()
              //   .collection("groups")
              //   .doc(groupCode)
              //   .get()
              //   .then((doc) => {
              //     if (doc.exists) {
              //       console.log(doc.data());
              //     } else {
              //       console.log("No such document!");
              //     }
              //   });
              console.log();
              //console.log(generateGroupCode(8));
              //navigation.navigate("GroupNavigator");
            }}
          >
            <Text style={styles.btnTxt}>Create</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}
