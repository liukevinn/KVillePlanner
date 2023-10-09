import { useMutation,  UseMutationResult, UseQueryResult } from "react-query";
import { setGroupScheduleInDB } from "../../../../common/src/db/schedule/schedule";
import { useQueryClient, useQuery } from "react-query";
import {fetchGroupSchedule} from "../../../../common/src/db/schedule/schedule";
import {ScheduleAndStartDate} from '../../../../common/src/db/schedule/scheduleAndStartDate';
import { getGroupMembersByGroupCode } from "../../../../common/src/db/groupExistenceAndMembership/groupMembership";





export const useMutationToUpdateSchedule = (groupCode : string) => {
    const queryClient = useQueryClient();
    return useMutation(
        {
            mutationFn : (newSchedule : string[]) => setGroupScheduleInDB(groupCode, newSchedule),
            onSuccess : (newSchedule : string[]) => {
                let queryKeyName = getQueryKeyNameForGroupCode(groupCode);
                let oldData : ScheduleAndStartDate | undefined = queryClient.getQueryData(queryKeyName);
                if (oldData === undefined) {
                    queryClient.invalidateQueries(queryKeyName);
                } else {
                    let newData = new ScheduleAndStartDate(newSchedule, oldData.startDate);
                    queryClient.setQueryData(queryKeyName, newData);
                }
            }
        }
    );

}



export const useQueryToFetchSchedule = (groupCode : string) : UseQueryResult<ScheduleAndStartDate> => {
    return useQuery<ScheduleAndStartDate, Error>(
        getQueryKeyNameForGroupCode(groupCode), 
        ()=> fetchGroupSchedule(groupCode),
        {
            onSuccess: () => {
                console.log("I fetched the schedule" );
                //setDateBeingShown(getDefaultDisplayDateRangeStartDate(scheduleAndStartDate ? scheduleAndStartDate : defaultData));
        
            }
        }
    );
}

export const useGetQueryDataForSchedule = (groupCode : string ) : ScheduleAndStartDate | undefined => {
    let queryClient = useQueryClient();
    return queryClient.getQueryData(getQueryKeyNameForGroupCode(groupCode));
}

interface GroupMemberType {
    userID : string;
    username : string
}
export const useQueryToFetchGroupMembers = (groupCode : string) : UseQueryResult<GroupMemberType[]> => {
    return useQuery<GroupMemberType[], Error>(
        ["fetching group members", groupCode],
        () => getGroupMembersByGroupCode(groupCode)

    )
}

export const getQueryKeyNameForGroupCode = (groupCode : string) : string =>  {
    return "getGroupSchedule"+groupCode;
}