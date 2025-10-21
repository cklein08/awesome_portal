import React, { useEffect, useState, useContext } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  Box,
  SelectChangeEvent,
} from "@mui/material";
import Grid from "@mui/material/Grid";

// import categorizer from utils (services folder not present)
import {
  applyCategoryRules,
  defaultRules,
  CategoryRule,
} from "../utils/assetCategorizer";
// read rules from AppConfigContext
import { AppConfigContext } from "../contexts/AppConfigContext";

type Asset = {
  id: string;
  name: string;
  category: string;
  campaign: string;
  usage: string;
};

const fetchAssets = async (rules: CategoryRule[]): Promise<Asset[]> => {
  try {
    const resp = await fetch("/api/assets"); // keep your search endpoint
    if (!resp.ok) {
      console.error("Failed to fetch assets:", resp.statusText);
      return [];
    }
    const raw = (await resp.json()) as any[]; // raw search results
    // apply your category rules here (use passed rules or defaultRules)
    const categorized = applyCategoryRules(raw, rules ?? defaultRules);
    return categorized as Asset[];
  } catch (err) {
    console.error("Error fetching assets:", err);
    return [];
  }
};

const groupBy = (assets: Asset[], key: keyof Asset) => {
  return assets.reduce<Record<string, number>>((acc, asset) => {
    const value = (asset[key] as string) || "Unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
};

const Dashboard: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // read category rules from AppConfigContext, fall back to defaultRules
  const appConfig = useContext(AppConfigContext);
  const categoryRules: CategoryRule[] = appConfig?.categoryRules ?? defaultRules;

  useEffect(() => {
    (async () => {
      const data = await fetchAssets(categoryRules);
      setAssets(data);
      setLoading(false);
    })();
    // JSON.stringify used to trigger effect when rules change
  }, [JSON.stringify(categoryRules)]);

  const categories = Array.from(
    new Set(assets.map((a) => a.category || "Unknown"))
  );
  const filteredAssets =
    categoryFilter === "All"
      ? assets
      : assets.filter((a) => a.category === categoryFilter);

  const categoryData = groupBy(filteredAssets, "category");
  const campaignData = groupBy(filteredAssets, "campaign");
  const usageData = groupBy(filteredAssets, "usage");

  if (loading)
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Asset Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid component="div"  xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Filter by Category</Typography>
              <Select
                fullWidth
                value={categoryFilter}
                onChange={(e: SelectChangeEvent) =>
                  setCategoryFilter(e.target.value as string)
                }
              >
                <MenuItem value="All">All</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </CardContent>
          </Card>
        </Grid>
        {/* Optionally add summary cards here */}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assets by Category
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={{
                    labels: Object.keys(categoryData),
                    datasets: [
                      {
                        label: "Assets",
                        data: Object.values(categoryData),
                        backgroundColor: "rgba(75,192,192,0.6)",
                      },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid  component="div"  xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assets by Campaign
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie
                  data={{
                    labels: Object.keys(campaignData),
                    datasets: [
                      {
                        label: "Assets",
                        data: Object.values(campaignData),
                        backgroundColor: [
                          "rgba(255,99,132,0.6)",
                          "rgba(54,162,235,0.6)",
                          "rgba(255,206,86,0.6)",
                          "rgba(75,192,192,0.6)",
                        ],
                      },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assets by Usage
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={{
                    labels: Object.keys(usageData),
                    datasets: [
                      {
                        label: "Assets",
                        data: Object.values(usageData),
                        backgroundColor: "rgba(153,102,255,0.6)",
                      },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
