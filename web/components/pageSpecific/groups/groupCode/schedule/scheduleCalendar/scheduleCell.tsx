import React, {useContext, useState, useEffect} from "react";
import { Grid, Paper, Typography } from "@mui/material";
import { CellColorsContext } from "../../../../../../lib/pageSpecific/schedule/cellColorsContext";
import { TenterSwapContext } from "@/lib/pageSpecific/schedule/tenterSwapContext";
import { Table, TableBody,TableCell,TableContainer,TableHead,TableRow } from "@material-ui/core";

interface ScheduleCellProps {
    name : string;
    startDate : Date;
    inBounds : boolean;
}

export const ScheduleCell : React.FC<ScheduleCellProps> = (props : ScheduleCellProps) => {
    const {cellColorsCoordinator} = useContext(CellColorsContext);
    const {isSwappingTenter, setIsSwappingTenter, setTenterToReplace, setTimeSlotClickedOn} = useContext(TenterSwapContext)
    const [color, setColor] = useState<string>("white")
    const handleClick = () => {
        if (props.inBounds){
            setIsSwappingTenter(true);
            setTenterToReplace(props.name);
            setTimeSlotClickedOn(props.startDate);
        }  
    }

    useEffect(() => {
        setColor(cellColorsCoordinator.getColorForName(props.name));
    }, [props.name]);

    
    return (
        <TableCell style={{
            height : "100%", 
            backgroundColor : color, 
            cursor : "grab",
            borderLeft : "1px solid black",
            borderRight : "1px solid black",
            borderTop : (props.startDate.getMinutes() == 0) ? "2px solid black " : "2px dashed black",
        }} onClick={handleClick}>
            <Typography align="center" >{props.name}</Typography>
            
        </TableCell>
    )
}