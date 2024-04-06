import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyDIwiQNOgECUazLciWXhgc894xOZg7agzc",
	authDomain: "win-chat-f6426.firebaseapp.com",
	projectId: "win-chat-f6426",
	storageBucket: "win-chat-f6426.appspot.com",
	messagingSenderId: "393973212890",
	appId: "1:393973212890:web:766d2e6a844ffa73eda7e3",
	measurementId: "G-TXTGR1QP22",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// if (window.location.hostname === "localhost") {
// 	connectAuthEmulator(auth, "http://localhost:9099");
// 	connectFirestoreEmulator(db, "http://localhost:8080");
// }

export { db, auth };
export default app;
