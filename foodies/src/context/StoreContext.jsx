import { useState } from "react";
import { createContext } from "react"; 
import { useEffect } from "react";
import { fetchFoodList } from "../service/foodService";
import {addToCart,removeQtyFromCart} from "../service/cartService";
import axios from "axios";


// eslint-disable-next-line react-refresh/only-export-components
export const StoreContext=createContext(null);
export const StoreContextProvider=(props)=>{
    const [foodList,setFoodList]=useState([]);
    const [quantities,setQuantities]=useState({});
    const[token,setToken]=useState("");
    const increaseQty=async(foodId)=>{
        setQuantities((prev)=>({...prev,[foodId]:(prev[foodId]||0)+1}));
        await addToCart(foodId,token);
    }
    const decreaseQty=async(foodId)=>{
        setQuantities((prev)=>({...prev,[foodId]:prev[foodId]> 0 ? prev[foodId]-1:0}));
        await removeQtyFromCart(foodId,token);
    };
    const removeFromCart=(foodId)=>{
        setQuantities((prevQuantities)=>{
            const updatedQuantities={...prevQuantities};
            delete updatedQuantities[foodId];
            return updatedQuantities;
        });
    };
    const loadCartData=async(token)=>{
        const response=await axios.get("http://localhost:8080/api/cart",{headers:{Authorization:`Bearer ${token}`}});
        setQuantities(response.data.items);
    }
    
    const contextValue={
        foodList,
        increaseQty,
        decreaseQty,
        quantities,
        removeFromCart,
        token,
        setToken,
        setQuantities,
        loadCartData

    };
    useEffect(()=>{
        async function loadData(){
            const data=await fetchFoodList();
            setFoodList(data);
            const tokenFromStorage=localStorage.getItem("token");
            if(tokenFromStorage){
                setToken(tokenFromStorage);
                await loadCartData(tokenFromStorage);
            }
        }
        loadData();//
    },[]);
    return(
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
        
    )
}
