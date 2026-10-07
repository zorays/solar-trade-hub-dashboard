import PageMeta from "../../components/common/PageMeta";

import DashboardWelcome from "../../components/ecommerce/DashboardWelcome";
import MarketplaceMetrics from "../../components/ecommerce/MarketplaceMetrics";
import PlatformActivityChart from "../../components/ecommerce/PlatformActivityChart";
import UserGrowthCard from "../../components/ecommerce/UserGrowthCard";
import RecentActivity from "../../components/ecommerce/RecentActivity";
import TopCategoriesCard from "../../components/ecommerce/TopCategoriesCard";
import QuickActions from "../../components/ecommerce/QuickActions";
import MissionBanner from "../../components/ecommerce/MissionBanner";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard | Solar Trade Hub"
        description="Solar Trade Hub administration dashboard."
      />

      <div className="space-y-5">
        <DashboardWelcome />

        <MarketplaceMetrics />

        <div className="grid grid-cols-12 items-stretch gap-5">
          <div className="col-span-12 xl:col-span-8">
            <PlatformActivityChart />
          </div>

          <div className="col-span-12 xl:col-span-4">
            <UserGrowthCard />
          </div>
        </div>

        <div className="grid grid-cols-12 items-stretch gap-5">
          <div className="col-span-12 lg:col-span-5">
            <RecentActivity />
          </div>

          <div className="col-span-12 lg:col-span-4">
            <TopCategoriesCard />
          </div>

          <div className="col-span-12 lg:col-span-3">
            <QuickActions />
          </div>
        </div>

        <MissionBanner />
      </div>
    </>
  );
}