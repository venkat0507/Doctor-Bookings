import { createContext } from "react";

export const AppContext = createContext()

const AppContextProvider = (props) => {

  const calculateAge = (dob) => {

    const today = new Date()
    const birtDate = new Date(dob)

    let age = today.getFullYear() - birtDate.getFullYear()

    return age

  }
    const months = [
      " ",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // ✅ FIX: Added helper to fetch user safely
    // const getLoggedInUser = () => {
    //   try {
    //     const user = JSON.parse(localStorage.getItem("user"));
    //     if (!user || !user._id) return null;
    //     return user;
    //   } catch (error) {
    //     console.error("Error reading user:", error);
    //     return null;
    //   }
    // };

    const slotDateFormat = (slotDate) => {
      const dateArray = slotDate.split("_");
      return (
        dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
      );
    };

    const value = {
      calculateAge,
      slotDateFormat,
    }

    return (
      <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
    );

}

export default AppContextProvider