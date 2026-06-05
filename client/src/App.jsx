import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import RoleRoute from './components/RoleRoute';
import AdminLayout from './components/AdminLayout';
import { ROLES } from './constants/roles';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RestaurantPage from './pages/RestaurantPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminRestaurantsPage from './pages/admin/AdminRestaurantsPage';
import AdminFoodItemsPage from './pages/admin/AdminFoodItemsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminDeliveryPage from './pages/admin/AdminDeliveryPage';
import AdminCartsPage from './pages/admin/AdminCartsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/restaurants/:id" element={<RestaurantPage />} />

              <Route
                path="/cart"
                element={
                  <RoleRoute roles={[ROLES.CUSTOMER]}>
                    <CartPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <RoleRoute roles={[ROLES.CUSTOMER]}>
                    <CheckoutPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <RoleRoute roles={[ROLES.CUSTOMER]}>
                    <OrdersPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <RoleRoute roles={[ROLES.CUSTOMER]}>
                    <OrderDetailPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <RoleRoute roles={[ROLES.CUSTOMER, ROLES.ADMIN]}>
                    <ProfilePage />
                  </RoleRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <RoleRoute roles={[ROLES.ADMIN]}>
                    <AdminLayout />
                  </RoleRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="restaurants" element={<AdminRestaurantsPage />} />
                <Route path="food-items" element={<AdminFoodItemsPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="delivery" element={<AdminDeliveryPage />} />
                <Route path="carts" element={<AdminCartsPage />} />
              </Route>
            </Routes>
          </main>
          <footer className="footer">
            <div className="container">
              <p>© {new Date().getFullYear()} FoodExpress — Admin & Customer roles</p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
