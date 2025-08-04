class ChangeEquityPercentageToDecimal < ActiveRecord::Migration[8.0]
  def change
    change_column :invoices, :equity_percentage, :decimal, precision: 5, scale: 2, null: false
    change_column :company_contractors, :equity_percentage, :decimal, precision: 5, scale: 2, default: 0, null: false
    change_column :invoices, :min_allowed_equity_percentage, :decimal, precision: 5, scale: 2
    change_column :invoices, :max_allowed_equity_percentage, :decimal, precision: 5, scale: 2
  end
end
