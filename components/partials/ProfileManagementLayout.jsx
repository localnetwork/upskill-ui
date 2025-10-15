import ProfileNavTabs from "../entities/profile/ProfileNavtabs";

export default function ProfileManagementLayout({ children }) {
  return (
    <div className=" p-[50px] mt-[50px]">
      <div className="shadow-box p-[50px]">
        <h1 className="text-3xl font-semibold">Profile & Settings</h1>

        <ProfileNavTabs />
        <div className="rounded-lg ">{children}</div>
      </div>
    </div>
  );
}
