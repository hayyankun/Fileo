const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 bg-[#1A1A1A] rounded-2xl shadow-soft">
      <div className="mb-8 text-[#808080]">{icon}</div>
      <h3 className="text-2xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-[#B0B0B0] text-center mb-10 max-w-md">{description}</p>
      {action && (
        <div className="transition-all duration-300 transform hover:scale-105">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
