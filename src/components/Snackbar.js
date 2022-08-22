import React from 'react';
import { Text, View, TouchableWithoutFeedback} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Snackbar } from 'react-native-paper';

import { toggleSnackBar } from '../redux/reducers/snackbarSlice';
import { useTheme } from '../context/ThemeProvider';

const CustomizedSnackbar = () => {
  const dispatch = useDispatch();
  const snackbarOpen = useSelector((state) => state.snackbar.snackbarOpen);
  const snackbarMessage = useSelector((state) => state.snackbar.snackbarMessage);
  const { theme } = useTheme();

  return (
    <TouchableWithoutFeedback onPress={() => dispatch(toggleSnackBar())}>
      <Snackbar
        visible={snackbarOpen}
        onDismiss={() => dispatch(toggleSnackBar())}
        wrapperStyle={{ top: 0 }}
        duration={2000}
        elevation={5}
      >
        <Text style={{ textAlign: 'center', color: theme.text1 }}>{snackbarMessage}</Text>
      </Snackbar>
    </TouchableWithoutFeedback>
  );
};

export default CustomizedSnackbar;