import { useAuth } from '../../contexts/AuthContext';
import AutoDeleteNotification from '../AutoDeleteNotification';

const Layout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <main className={`flex-1 ${user ? 'pt-16' : ''}`}>
        {children}
      </main>
      {user && <AutoDeleteNotification />}
    </div>
  );
};

export default Layout;
