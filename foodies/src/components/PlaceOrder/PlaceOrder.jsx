import React, { useContext, useState } from 'react';
import {RAZORPAY_KEY} from '../../util/constants';
import './PlaceOrder.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import { calculateCartTotals } from '../../util/cartUtils';
import axios from 'axios';
 import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
//import Razorpay from "razorpay";

const PlaceOrder = () => {
  const {foodList,quantities,token,setQuantities}=useContext(StoreContext);
  const navigate=useNavigate();

      const [data,setData]=useState({
        firstName:'',
        lastName:'',
        email:'',
        phoneNumber:'',
        address:'',
        state:'',
        city:'',
        zip:''
      });
      
      const onChangeHandler=(event)=>{
        const name=event.target.name;
        const value=event.target.value;
        setData(data=>({...data,[name]:value}));
      }
      const onSubmitHandler=async(event)=>{
        event.preventDefault();
        const orderData={
          userAddress:`${data.firstName}, ${data.lastName},${data.address}, ${data.city},${data.state},${data.zip}`,
          phoneNumber:data.phoneNumber,
          email:data.email,
          orderedItems:cartItems.map(item=>({foodId:item.foodId,quantity:quantities[item.id],
            price:item.price*quantities[item.id],
            category:item.category,
            imageUrl:item.imageUrl,
            description:item.description,
            name:item.name
          })),
          amount:total.toFixed(2),
          orderStatus:"preparing"
        };
        try {
          const response=await axios.post("http://localhost:8080/api/orders/create",orderData,{headers:{Authorization:`Bearer ${token}`}});
          if(response.status===201 && response.data.razorpayOrderId){
            //initiate the payment
            initiateRazorpayPayment(response.data);
          }else{
            toast.error("unable to place order. Please try again");
          }
        } catch (error) {
          toast.error("unable to place order. Please try again",error);
        }

      };
      const initiateRazorpayPayment=(order)=>{
        const options={
          key:RAZORPAY_KEY,
          amount:order.amount,
          currency:"INR",
          name:"Nandan Hotel",
          description:"Food order payment",
          order_id:order.razorpayOrderId,
          handler:async function(razorpayResponse){
            await verifyPayment(razorpayResponse);
          },
              prefill:{
                name:`${data.firstName},${data.lastName}`,
                email:data.email,
                contact:data.phoneNumber
              },
              theme:{color:"#3399cc"},
              modal:{
                ondismiss:async function(){
                  toast.error("payment cancelled.");
                  await deleteOrder(order.id);
                }
              }
            };
            const razorpay=new window.Razorpay(options);
            razorpay.open();
          };

          const verifyPayment=async(razorpayResponse)=>{
            const paymentData={
              razorpay_payment_id:razorpayResponse.razorpay_payment_id,
              razorpay_order_id:razorpayResponse.razorpay_order_id,
              razorpay_signature:razorpayResponse.razorpay_signature
            };
            try {
               const response=await axios.post("http://localhost:8080/api/orders/verify",paymentData,{headers:{Authorization:`Bearer ${token}`}});
            if(response.status===200){
              toast.success("payment successful");
              await clearCart();
              navigate('/myorders');
            }else{
              toast.error('payment failed. Please try again.');
              navigate('/');
            }
              
            } catch (error) {
              toast.error('payment failed. Please try again.',error);
            }
           
          };
          const deleteOrder=async(orderId)=>{
            try {
              await axios.delete('http://localhost:8080/api/orders/'+orderId,{headers:{Authorization:`Bearer ${token}`}});
            } catch (error) {
              toast.error('Something went wrong. Contact support team',error);
            }
          }
           const clearCart=async()=>{
            try {
              await axios.delete('http://localhost:8080/api/cart/clear',{headers:{Authorization:`Bearer ${token}`}});
              setQuantities({});
            } catch (error) {
              toast.error('Error while clearing the cart',error);
            }
          }
        
    
      const cartItems= foodList.filter(food=>quantities[food.id]>0);
      const {subtotal,shipping,tax,total}=calculateCartTotals(cartItems,quantities);  

  return (
    <div className="container my-4">
      <div className="py-5 text-center">
        <img className='d-block mx-auto' src={assets.logo1} alt="" width={98} height={98}/>
      </div>
      <div className="row g-5">
        <div className="col-md-5 col-lg-4 order-md-last">
          <h4 className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-primary">Your cart</span>
            <span className="badge bg-primary rounded-pill">{cartItems.length}</span>
          </h4>
          <ul className="list-group mb-3">
            {cartItems.map(item=>(
                  <li className="list-group-item d-flex justify-content-between lh-sm">
              <div>
                <h6 className="my-0">{item.name}</h6>
                <small className="text-body-secondary">
                  Qty:{quantities[item.id]}
                </small>
              </div>
              <span className="text-muted">&#8377;{item.price*quantities[item.id]}</span>
            </li>
            ))}
        
            <li className="list-group-item d-flex justify-content-between lh-condensed">
              <div>
                <span>Shipping</span>
              </div>
              <span className="text-body-secondary">&#8377;{subtotal===0?0.0:shipping.toFixed(2)}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <div>
                <span>Tax(10%)</span>
              </div>
              <span className="text-body-secondary">&#8377;{tax.toFixed(2)}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span>Total (INR)</span>
              <strong>&#8377;{total.toFixed(2)}</strong>
            </li>
          </ul>


        </div>
        <div className="col-md-8 order-md-1">
          <h4 className="mb-3">Billing address</h4>
          <form className="needs-validation" onSubmit={onSubmitHandler}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>First name</label>
                <input type="text" className="form-control" id="firstName" placeholder="John" required
                name="firstName"
                onChange={onChangeHandler}
                value={data.firstName}/>
              </div>
              <div className="col-md-6 mb-3">
                <label>Last name</label>
                <input type="text" className="form-control" id="lastName" placeholder="Doe" required
                name="lastName"
                onChange={onChangeHandler}
                value={data.lastName}/>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor='email' className='form-label'>Email</label>
              <input type="email" className="form-control" id="email" placeholder="Email"
              name="email"
                onChange={onChangeHandler}
                value={data.email}/>
            </div>
            <div className="mb-3">
              <label>Phone Number</label>
              <input type="number" className="form-control" id="phone" placeholder="9887548382" required
              name="phoneNumber"
                onChange={onChangeHandler}
                value={data.phoneNumber}/>
            </div>

            <div className="mb-3">
              <label>Address</label>
              <input type="text" className="form-control" id="address" placeholder="1234 Main St" required
              name="address"
                onChange={onChangeHandler}
                value={data.address}/>
            </div>


            <div className="row">
              <div className="col-md-5 mb-3">
                <label>State</label>
                <select className="custom-select d-block w-100" id="state" required
                name="state"
                onChange={onChangeHandler}
                value={data.state}>
                  <option value="">Choose...</option>
                  <option>Odisha</option>
                </select>
                <div className="invalid-feedback" >
                  Please select a valid state.
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <label>City</label>
                <select className="custom-select d-block w-100" id="city" required
                name="city"
                onChange={onChangeHandler}
                value={data.city}>
                  <option value="">Choose...</option>
                  <option>Berhampur</option>
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label>Zip</label>
                <input type="number" className="form-control" id="zip" placeholder="760004" required
                name="zip"
                onChange={onChangeHandler}
                value={data.zip}/>
              </div>
            </div>
            <hr className="mb-4"/>
            <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={cartItems.length===0}>Continue to checkout</button>
          </form>
        </div>
      </div>
      </div>
  )
}

export default PlaceOrder;