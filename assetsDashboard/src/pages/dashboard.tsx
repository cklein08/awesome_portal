import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";

type Asset = {
  id: string;
  type: string;
  name: string;
  // Add other relevant fields
};

const fetchAssets = async (): Promise<Asset[]> => {
  // Replace with your actual API endpoint or context fetch
  const resp = await fetch("/api/assets");
  return resp.json();
};

const Dashboard: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets().then(data => {
      setAssets(data);
      setLoading(false);
    });
  }, []);

  // Count assets by type
  const assetTypeCounts = assets.reduce<Record<string, number>>((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(assetTypeCounts),
    datasets: [
      {
        label: "Asset Count",
        data: Object.values(assetTypeCounts),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Asset Dashboard</h2>
      <Bar data={chartData} />
    </div>
  );
};

export default Dashboard;