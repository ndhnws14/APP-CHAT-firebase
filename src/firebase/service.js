import { Timestamp, addDoc, collection } from "firebase/firestore";
import { db } from "./config";

export const addDocument = async (collectionName, data) => {
	try {
		const collectionRef = collection(db, collectionName);
		const timestamp = Timestamp.now();

		await addDoc(collectionRef, {
			...data,
			createdAt: timestamp,
		});

		console.log("Document added successfully");
	} catch (error) {
		console.error("Error adding document: ", error);
	}
};
export const generateKeywords = (displayName) => {
	const name = displayName.split(" ").filter((word) => word);

	const length = name.length;
	let flagArray = [];
	let result = [];
	let stringArray = [];

	for (let i = 0; i < length; i++) {
		flagArray[i] = false;
	}
	const createKeywords = (name) => {
		const arrName = [];
		let curName = "";
		name.split("").forEach((letter) => {
			curName += letter;
			arrName.push(curName);
		});
		return arrName;
	};

	function findPermutation(k) {
		for (let i = 0; i < length; i++) {
			if (!flagArray[i]) {
				flagArray[i] = true;
				result[k] = name[i];

				if (k === length - 1) {
					stringArray.push(result.join(" "));
				}

				findPermutation(k + 1);
				flagArray[i] = false;
			}
		}
	}

	findPermutation(0);

	const keywords = stringArray.reduce((acc, cur) => {
		const words = createKeywords(cur);
		return [...acc, ...words];
	}, []);

	return keywords;
};
