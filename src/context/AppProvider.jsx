import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { AuthContext } from "./AuthContext.jsx";
import useFirestore from "../hook/useFireStore.js";
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
	const [isAddRoomVisible, setIsAddRoomVisible] = useState(false);
	const [isInviteMemberVisible, setIsInviteMemberVisible] = useState(false);
	const [isSelectedRoomId, setIsSelectedRoomId] = useState("");
	const [members, setMembers] = useState([]);

	const currentUser = useContext(AuthContext).currentUser;
	const uid = currentUser?.uid;

	const roomsCondition = useMemo(() => {
		return {
			fieldName: "members",
			operator: "array-contains",
			compareValues: uid,
		};
	}, [uid]);

	const rooms = useFirestore("rooms", roomsCondition);

	const room = useMemo(() => {
		return rooms.find((room) => room.id === isSelectedRoomId);
	}, [rooms, isSelectedRoomId]);
	const selectedRoom = room ? room : rooms[0];

	useEffect(() => {
		setMembers([]);
		if (selectedRoom && selectedRoom.members) {
			let q = query(
				collection(db, "users"),
				where("uid", "in", selectedRoom.members),
			);
			const unsubscribe = onSnapshot(q, (snapshot) => {
				const docs = snapshot.docs.map((doc) => ({
					...doc.data(),
					id: doc.id,
				}));
				setMembers(docs);
			});
			return () => {
				unsubscribe();
			};
		}
	}, [uid, selectedRoom]);

	return (
		<AppContext.Provider
			value={{
				rooms,
				members,
				selectedRoom,
				isAddRoomVisible,
				setIsAddRoomVisible,
				isSelectedRoomId,
				setIsSelectedRoomId,
				isInviteMemberVisible,
				setIsInviteMemberVisible,
			}}>
			{children}
		</AppContext.Provider>
	);
};
