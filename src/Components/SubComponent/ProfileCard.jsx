import React from "react";
import { Mail, Phone, User } from "lucide-react";

const ProfileCard = () => {
  const data = {
    name: "Bharti",
    email: "bharti@example.com",
    phone: 1122334400,
    supervisorName: "demo",
    position: "Worker",
  };

  return (
    <div className=" flex items-start justify-center bg-gray-100 py-10">
      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Banner Section */}
        <div className="relative h-28 bg-gradient-to-r from-[#504255] to-[#cbb4d4]">
          <div className="absolute left-1/2 -bottom-12 transform -translate-x-1/2">
            <img
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(
                data.name
              )}`}
              alt="profile"
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="pt-16 px-6 pb-6 text-center">
          <h1 className="text-xl font-bold">{data.name}</h1>
          <p className="text-gray-600 text-sm">
            Supervisor name : {data.supervisorName}
          </p>

          {/* Contact Info */}
          <div className="mt-6 space-y-3 text-sm text-gray-700">
            <div className="flex items-center justify-center">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              Email : {data.email}
            </div>
            <div className="flex items-center justify-center">
              <Phone className="w-4 h-4 mr-2 text-gray-500" />
              Contanct : {data.phone}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 border-t pt-3 flex items-center justify-center text-gray-500 text-xs space-x-2">
            <User className="w-4 h-4" />
            <span>{data.position}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
