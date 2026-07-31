import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import axios from 'axios'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import CustomerService from './pages/CustomerService'
import FAQ from './pages/FAQ'
import PurchaseGuidance from './pages/PurchaseGuidance'
import Product from './pages/Product/Product'
import Cart from './pages/Cart/Cart'
import Wishlist from './pages/Wishlist/Wishlist'
import Login from './pages/LoginSignUp/Login'
import Signup from './pages/LoginSignUp/Signup'
import ForgotPassword from './pages/Password/ForgotPassword'
import ResetPassword from './pages/Password/ResetPassword'
import Verify from './pages/Order/Verify'
import PlaceOrder from './pages/Order/PlaceOrder'
import Orders from './pages/Order/Orders'
import TrackOrder from './pages/Order/TrackOrder'
import Chat from './pages/Chat'
import AdminApp from './admin/App'

import NewArrivalsWomen from './pages/NewArrivals/NewArrivalsWomen'
import NewArrivalsMen from './pages/NewArrivals/NewArrivalsMen'
import NewArrivalsAccessories from './pages/NewArrivals/NewArrivalsAccessories'
import DiscoverFashion from './pages/Accessories/DiscoverFashion'
import DiscoverFashionPage from './pages/DiscoverFashionPages/DiscoverFashionPage'

import WomenViewAll from './pages/Women/WomenViewAll'
import WomenTopsShirts from './pages/Women/WomenTopsShirts'
import WomenBottomwear from './pages/Women/WomenBottomwear'
import WomenOuterwears from './pages/Women/WomenOuterwears'

import MenViewAll from './pages/Men/MenViewAll'
import MenTopsShirts from './pages/Men/MenTopsShirts'
import MenBottomwear from './pages/Men/MenBottomwear'
import MenOuterwears from './pages/Men/MenOuterwears'
import WomenCollection from './pages/Collection/WomenCollection'
import MenCollection from './pages/Collection/MenCollection'
import WomenCollectionView from './pages/Collection/WomenCollectionView'
import MenCollectionView from './pages/Collection/MenCollectionView'
import CollectionViewAll from './pages/Collection/CollectionViewAll'
import CollectionView from './pages/Collection/CollectionView'

import AccessoriesViewAll from './pages/Accessories/AccessoriesViewAll'
import AccessoriesBags from './pages/Accessories/AccessoriesBags'
import AccessoriesBoxers from './pages/Accessories/AccessoriesBoxers'
import AccessoriesHats from './pages/Accessories/AccessoriesHats'
import AccessoriesCharmsStuff from './pages/Accessories/AccessoriesCharmsStuff'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SearchBar from './components/SearchBar'
import useAuth from './hooks/useAuth'
import { backendUrl } from './constants/shopConfig'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { consumeAuthSuccessToast } from './utils/authToast'

const App = () => {
  const location = useLocation()
  const { token } = useAuth()
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  useEffect(() => {
    if (location.pathname !== '/') return

    const message = consumeAuthSuccessToast()
    if (message) toast.success(message)
  }, [location.pathname])

  useEffect(() => {
    const cleanupPendingCheckout = async () => {
      const checkoutId = localStorage.getItem('pendingCheckoutId')
      if (!token || !checkoutId) return

      const searchParams = new URLSearchParams(window.location.search)
      const isActiveVerify = location.pathname === '/verify' && searchParams.get('checkoutId') === checkoutId
      if (isActiveVerify) return

      try {
        const response = await axios.post(backendUrl + '/api/pending-checkout/cancel', { checkoutId }, { headers: { token } })
        const shouldClearCheckout = response.data.success || response.data.message === 'Checkout not found'
        if (shouldClearCheckout && localStorage.getItem('pendingCheckoutId') === checkoutId) localStorage.removeItem('pendingCheckoutId')
      } catch (error) {
        console.log(error)
      }
    }

    cleanupPendingCheckout()
    window.addEventListener('pageshow', cleanupPendingCheckout)
    return () => window.removeEventListener('pageshow', cleanupPendingCheckout)
  }, [location.pathname, location.search, token])

  return (
    <div className='w-full overflow-x-clip'>
      <ToastContainer />
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <div className='navbar-spacer'></div>}
      {!isAdminRoute && <SearchBar />}

      <Routes>
        <Route path='/admin/*' element={<AdminApp />} />
        <Route path='/' element={<Home />} />
     

        <Route path='/new-arrivals/women' element={<NewArrivalsWomen />} />
        <Route path='/new-arrivals/men' element={<NewArrivalsMen />} />
        <Route path='/new-arrivals/accessories' element={<NewArrivalsAccessories />} />
        <Route path='/Discover-Fashion' element={<DiscoverFashion />} />
        <Route path='/discover-fashion/spring-27' element={<DiscoverFashionPage />} />
        <Route path='/discover-fashion/winter-26' element={<DiscoverFashionPage />} />
        <Route path='/discover-fashion/fall-26' element={<DiscoverFashionPage />} />
        <Route path='/discover-fashion/summer-26' element={<DiscoverFashionPage />} />
        <Route path='/discover-fashion/spring-24' element={<DiscoverFashionPage />} />
        <Route path='/discover-fashion/winter-25' element={<DiscoverFashionPage />} />
        <Route path='/discover-fashion/spring-23' element={<DiscoverFashionPage />} />
        <Route path='/discover-fashion/winter-23' element={<DiscoverFashionPage />} />

        <Route path='/women/view-all' element={<WomenViewAll />} />
        <Route path='/women/tops-shirts' element={<WomenTopsShirts />} />
        <Route path='/women/bottomwear' element={<WomenBottomwear />} />
        <Route path='/women/outerwears' element={<WomenOuterwears />} />

        <Route path='/men/view-all' element={<MenViewAll />} />
        <Route path='/men/tops-shirts' element={<MenTopsShirts />} />
        <Route path='/men/bottomwear' element={<MenBottomwear />} />
        <Route path='/men/outerwears' element={<MenOuterwears />} />

        <Route path='/collection/view-all' element={<CollectionViewAll />} />
        <Route path='/collection/:collectionRoute' element={<CollectionView />} />
        <Route path='/women-collection' element={<WomenCollection />} />
        <Route path='/women-collection/:collectionRoute' element={<WomenCollectionView />} />
        <Route path='/men-collection' element={<MenCollection />} />
        <Route path='/men-collection/:collectionRoute' element={<MenCollectionView />} />

        <Route path='/accessories/view-all' element={<AccessoriesViewAll />} />
        <Route path='/accessories/bags' element={<AccessoriesBags />} />
        <Route path='/accessories/boxers' element={<AccessoriesBoxers />} />
        <Route path='/accessories/hats' element={<AccessoriesHats />} />
        <Route path='/accessories/charms-stuff' element={<AccessoriesCharmsStuff />} />

        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/customer-service' element={<CustomerService />} />
        <Route path='/faq' element={<FAQ />} />
        <Route path='/purchase-guidance' element={<PurchaseGuidance />} />
        <Route path='/product/:productId' element={<Product />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/wishlist' element={<Wishlist />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/reset-password/:token' element={<ResetPassword />} />
        <Route path='/place-order' element={<PlaceOrder />} />
        <Route path='/orders' element={<Orders />} />
        <Route path='/verify' element={<Verify />} />
        <Route path='/track-order/:orderId' element={<TrackOrder />} />
      </Routes>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <Chat />}
    </div>
  )
}

export default App
