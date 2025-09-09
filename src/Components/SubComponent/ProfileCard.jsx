import React from "react";
import { Mail, Phone, User } from "lucide-react";
import { EmpyoleeProfileApi } from "./data";
import { useQuery } from "@tanstack/react-query";

const ProfileCard = () => {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: EmpyoleeProfileApi,
  });

  return (
    <div className="flex items-start justify-center bg-gray-100 py-10">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Banner Section */}
        <div className="relative h-28 bg-gradient-to-r from-[#504255] to-[#cbb4d4]">
          <div className="absolute left-1/2 -bottom-12 transform -translate-x-1/2">
            <img
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
              src={
                profile?.profileImage ||
                `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(
                  profile?.name || "User"
                )}`
              }
              alt="profile"
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="pt-16 px-6 pb-6 text-center">
          {/* Name */}
          <h1 className="text-xl font-bold mb-1">
            {profile?.name || "Unknown"}
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            Supervisor Name:{" "}
            <span className="font-medium">
              {profile?.supervisorName || "N/A"}
            </span>
          </p>

          {/* Contact Info */}
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center justify-center">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              <span>{profile?.email || "N/A"}</span>
            </div>
            <div className="flex items-center justify-center">
              <Phone className="w-4 h-4 mr-2 text-gray-500" />
              <span>{profile?.phone || "N/A"}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 border-t pt-3 flex items-center justify-center text-gray-500 text-xs">
            <User className="w-4 h-4 mr-2" />
            <span>{profile?.position || "Employee"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
