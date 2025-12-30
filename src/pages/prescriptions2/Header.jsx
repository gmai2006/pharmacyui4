import { Pill } from 'lucide-react';


 const Header = () => {
    return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pill className="text-blue-600" size={32} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prescription Workflow</h1>
            
          </div>
        </div>
     
      </div>
    </div>
    )
  }

  export default Header;