
const UserSummary = ({users}) => {
    const set = new Set(users.flatMap(u => u.roles)
                        .map(r => r.roleName));
    const roles = [...set];                  
    return (
          <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-indigo-900 mb-3">User Role Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {roles.map((role) => {
                const count = users.flatMap(u => u.roles).map(r => r.roleName).filter(u => u.includes(role)).length;
                return (
                  <div key={role} className="bg-white rounded-lg p-4 border border-indigo-100">
                    <p className="text-sm text-gray-600 mb-1">{role}</p>
                    <p className="text-2xl font-bold text-indigo-600">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
    )
}
export default UserSummary;