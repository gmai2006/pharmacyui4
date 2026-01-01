import { Pill, Plus } from 'lucide-react';
import { useUser } from "../../context/UserContext";
import { hasPermission } from '../../utils/util';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const { appUser } = useUser();
  const permissions = ['PHARMACIST', 'TECH'];

  const goToIntake = () => {
    navigate(`/intake`);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">

        {/* Left: Title */}
        <div className="flex items-center gap-3">
          <Pill className="text-blue-600" size={32} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Prescription Workflow
            </h1>
          </div>
        </div>

        {/* Right: Intake Button */}
        {hasPermission(appUser.roles, permissions) && <button
          onClick={goToIntake}
          className="inline-flex items-center gap-2 px-4 py-2
                     bg-blue-600 hover:bg-blue-700
                     text-white text-sm font-medium
                     rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} />
          New Intake
        </button>}

      </div>
    </div>
  );
};

export default Header;
