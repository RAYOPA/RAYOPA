import os
import pandas as pd
from typing import Dict, Any
from ..tool_registry import ToolResult, ToolContext

def analyze_file_execute(input_data: Dict[str, Any], context: ToolContext) -> ToolResult:
    """
    Executes a data analysis operation on an uploaded CSV or Excel file.
    """
    filepath = input_data.get("filepath")
    query_type = input_data.get("query_type", "summary")
    target_column = input_data.get("target_column")
    
    if not filepath or not os.path.exists(filepath):
        return ToolResult(status="FAILED", error=f"File not found: {filepath}")
        
    try:
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        elif filepath.endswith('.xlsx') or filepath.endswith('.xls'):
            df = pd.read_excel(filepath)
        else:
            return ToolResult(status="FAILED", error="Unsupported file format. Please upload a .csv or .xlsx file.")
            
        result_data = {}
        
        if query_type == "summary":
            # Give basic statistical summary
            summary = df.describe(include='all').to_dict()
            
            # Clean up NaN values for JSON serialization
            clean_summary = {}
            for col, stats in summary.items():
                clean_summary[col] = {k: (v if pd.notna(v) else None) for k, v in stats.items()}
                
            result_data = {
                "rows": len(df),
                "columns": list(df.columns),
                "summary": clean_summary
            }
            
        elif query_type == "top_5":
            if not target_column or target_column not in df.columns:
                return ToolResult(status="FAILED", error=f"Target column '{target_column}' is missing.")
                
            # Convert to numeric if possible for sorting
            df[target_column] = pd.to_numeric(df[target_column], errors='ignore')
            top_df = df.sort_values(by=target_column, ascending=False).head(5)
            # Fill NaN with None
            top_df = top_df.where(pd.notnull(top_df), None)
            result_data = {"top_5": top_df.to_dict(orient="records")}
            
        elif query_type == "search":
            if not target_column or target_column not in df.columns:
                return ToolResult(status="FAILED", error=f"Target column '{target_column}' is missing.")
            search_value = input_data.get("search_value")
            if not search_value:
                return ToolResult(status="FAILED", error="Missing search_value.")
            
            filtered_df = df[df[target_column].astype(str).str.contains(str(search_value), case=False, na=False)]
            filtered_df = filtered_df.where(pd.notnull(filtered_df), None)
            result_data = {"matches": filtered_df.head(20).to_dict(orient="records")}
            
        else:
            return ToolResult(status="FAILED", error=f"Unknown query_type: {query_type}")
            
        return ToolResult(status="SUCCESS", data=result_data)
        
    except Exception as e:
        return ToolResult(status="FAILED", error=f"Error analyzing file: {str(e)}")
