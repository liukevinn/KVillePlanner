import { useMutation,  UseMutationResult, UseQueryResult } from "react-query";
import { setGroupScheduleInDB } from "../../../../common/src/db/schedule/schedule";
import { useQueryClient, useQuery, QueryClient } from "react-query";
import {fetchGroupSchedule} from "../../../../common/src/db/schedule/schedule";
import {ScheduleAndStartDate} from '../../../../common/src/db/schedule/scheduleAndStartDate';
import { getGroupMembersByGroupCode } from "../../../../common/src/db/groupExistenceAndMembership/groupMembership";
import {useRouter} from "next/router";
import { INVALID_GROUP_CODE } from "../../../../common/src/db/groupExistenceAndMembership/GroupCode";
import { assignTentersAndGetNewFullSchedule } from "../../../../common/src/scheduling/externalInterface/createGroupSchedule";



const onSuccessfulDBScheduleUpdate = (newSchedule : string[], groupCode : string, queryClient : QueryClient) => {
    console.log("updating queries and what not with " );
    console.log(newSchedule);
    let queryKeyName = getQueryKeyNameForScheduleFetch(groupCode);
    let oldData : ScheduleAndStartDate | undefined = queryClient.getQueryData(queryKeyName);
    if (oldData === undefined) {
        queryClient.invalidateQueries(queryKeyName);
    } else {
        let newData = new ScheduleAndStartDate(newSchedule, oldData.startDate);
        queryClient.setQueryData(queryKeyName, newData);
        //queryClient.refetchQueries(queryKeyName);
        queryClient.invalidateQueries(queryKeyName);
    }

}

export const useMutationToUpdateSchedule = (groupCode : string) => {
    const queryClient = useQueryClient();
    return useMutation(
        {
            mutationFn : (newSchedule : string[]) => setGroupScheduleInDB(groupCode, newSchedule),
            onSuccess : (newSchedule : string[]) => {
                onSuccessfulDBScheduleUpdate(newSchedule, groupCode, queryClient);
            }
        }
    );

}


const assignAndUpdateMutationFn = async (groupCode : string, startDate : Date, endDate : Date, tentType : string, oldSchedule : ScheduleAndStartDate) => {
    const newSchedule = await assignTentersAndGetNewFullSchedule(groupCode, tentType, startDate, endDate, oldSchedule);
    return await setGroupScheduleInDB(groupCode, newSchedule);

}

interface useMutationToAssignTentersAndUpdateScheduleData {
    startDate : Date;
    endDate : Date;
    oldSchedule : ScheduleAndStartDate;
    tentType : string;
}
export const useMutationToAssignTentersAndUpdateSchedule = (groupCode : string) => {
    const queryClient = useQueryClient();
    return useMutation (
        {
            mutationFn : (mutationData : useMutationToAssignTentersAndUpdateScheduleData) => assignAndUpdateMutationFn(groupCode, mutationData.startDate, mutationData.endDate, mutationData.tentType, mutationData.oldSchedule),
            onSuccess : (newSchedule : string[]) => {
                console.log("successfully ran the mutation, got back the following");
                console.log(newSchedule);
                onSuccessfulDBScheduleUpdate(newSchedule, groupCode, queryClient)
            },
            onError : () => {console.log("what the heck")}
        }
    );

}



export const useQueryToFetchSchedule = (groupCode : string) : UseQueryResult<ScheduleAndStartDate> => {
    const router = useRouter();

    return useQuery<ScheduleAndStartDate, Error>(
        getQueryKeyNameForScheduleFetch(groupCode), 
        ()=> {
            if (groupCode === INVALID_GROUP_CODE){
                throw new Error("");
            }
            return fetchGroupSchedule(groupCode);
        },
        {
            onSuccess: (data) => {
                console.log("I fetched the schedule" );
            }
        }
    );
}



export const getQueryKeyNameForScheduleFetch = (groupCode : string) : string =>  {
    return "getGroupSchedule";
}

export const useGetQueryDataForSchedule = (groupCode : string ) : ScheduleAndStartDate | undefined => {
    let queryClient = useQueryClient();
    return queryClient.getQueryData(getQueryKeyNameForScheduleFetch(groupCode));
}

interface GroupMemberType {
    userID : string;
    username : string
}
export const useQueryToFetchGroupMembers = (groupCode : string) : UseQueryResult<GroupMemberType[]> => {
    return useQuery<GroupMemberType[], Error>(
        ["fetching group members", groupCode],
        () => getGroupMembersByGroupCode(groupCode),
        {
            initialData : []
        }

    )
}

