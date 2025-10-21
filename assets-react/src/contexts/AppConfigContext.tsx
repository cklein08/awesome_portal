import React from "react";
// add import for CategoryRule type
import { CategoryRule } from "../services/assetCategorizer";

export type AppConfigContextType = {
	// ...existing properties...
	// allow optional categoryRules in the app config
	categoryRules?: CategoryRule[];
};

// ensure the context is typed using the updated AppConfigContextType
export const AppConfigContext = React.createContext<AppConfigContextType | null>(null);