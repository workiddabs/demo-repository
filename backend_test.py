import requests
import json
import os
import sys
from dotenv import load_dotenv
import unittest

# Load environment variables from frontend/.env to get the backend URL
load_dotenv('/app/frontend/.env')
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL')
API_URL = f"{BACKEND_URL}/api"

class ElectricityMeterCalculatorTests(unittest.TestCase):
    
    def setUp(self):
        # Clear all calculations at the start of each test run
        self.clear_calculations()
    
    def clear_calculations(self):
        """Helper method to clear all calculations"""
        response = requests.delete(f"{API_URL}/calculations")
        return response.json()
    
    def test_api_health(self):
        """Test the API health check endpoint"""
        response = requests.get(f"{API_URL}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["message"], "Electricity Meter Calculator API")
        print("✅ API health check passed")
    
    def test_get_rates(self):
        """Test the rates retrieval endpoint"""
        response = requests.get(f"{API_URL}/rates")
        self.assertEqual(response.status_code, 200)
        rates = response.json()
        
        # Verify residential tiered rates
        self.assertIn("residential", rates)
        residential_rates = rates["residential"]
        self.assertEqual(len(residential_rates), 5)
        
        # Verify tier 1: 1-200kW at 2.19 AFN
        self.assertEqual(residential_rates[0]["min"], 1)
        self.assertEqual(residential_rates[0]["max"], 200)
        self.assertEqual(residential_rates[0]["rate"], 2.19)
        
        # Verify tier 2: 201-400kW at 5.63 AFN
        self.assertEqual(residential_rates[1]["min"], 201)
        self.assertEqual(residential_rates[1]["max"], 400)
        self.assertEqual(residential_rates[1]["rate"], 5.63)
        
        # Verify tier 3: 401-700kW at 8.13 AFN
        self.assertEqual(residential_rates[2]["min"], 401)
        self.assertEqual(residential_rates[2]["max"], 700)
        self.assertEqual(residential_rates[2]["rate"], 8.13)
        
        # Verify tier 4: 701-2000kW at 11.25 AFN
        self.assertEqual(residential_rates[3]["min"], 701)
        self.assertEqual(residential_rates[3]["max"], 2000)
        self.assertEqual(residential_rates[3]["rate"], 11.25)
        
        # Verify tier 5: 2001+kW at 12.5 AFN
        self.assertEqual(residential_rates[4]["min"], 2001)
        self.assertEqual(residential_rates[4]["rate"], 12.5)
        
        # Verify commercial flat rate: 16.25 AFN per kW
        self.assertIn("commercial", rates)
        self.assertEqual(rates["commercial"]["rate"], 16.25)
        
        # Verify factory flat rate: 6.75 AFN per kW
        self.assertIn("factory", rates)
        self.assertEqual(rates["factory"]["rate"], 6.75)
        
        print("✅ Rate retrieval test passed")
    
    def test_kw_to_money_residential_tier1(self):
        """Test kW to money conversion for residential tier 1"""
        # Test consumption within tier 1 (1-200kW)
        response = requests.post(
            f"{API_URL}/calculate/kw-to-money",
            params={
                "meter_type": "residential",
                "previous_reading": 100,
                "current_reading": 250  # 150kW consumption (tier 1)
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify consumption
        self.assertEqual(data["consumption"], 150)
        self.assertEqual(data["meter_type"], "residential")
        
        # Verify total cost: 150kW * 2.19 AFN = 328.5 AFN
        expected_cost = 150 * 2.19
        self.assertAlmostEqual(data["total_cost"], expected_cost, places=2)
        
        # Verify breakdown
        self.assertEqual(len(data["breakdown"]), 1)
        self.assertEqual(data["breakdown"][0]["tier"], "1-200")
        self.assertEqual(data["breakdown"][0]["usage"], 150)
        self.assertEqual(data["breakdown"][0]["rate"], 2.19)
        self.assertAlmostEqual(data["breakdown"][0]["cost"], expected_cost, places=2)
        
        print("✅ Residential tier 1 calculation test passed")
    
    def test_kw_to_money_residential_multiple_tiers(self):
        """Test kW to money conversion for residential spanning multiple tiers"""
        # Test consumption spanning tiers 1 and 2 (250kW)
        response = requests.post(
            f"{API_URL}/calculate/kw-to-money",
            params={
                "meter_type": "residential",
                "previous_reading": 100,
                "current_reading": 350  # 250kW consumption (200kW in tier 1, 50kW in tier 2)
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify consumption
        self.assertEqual(data["consumption"], 250)
        self.assertEqual(data["meter_type"], "residential")
        
        # Verify total cost: (200kW * 2.19 AFN) + (50kW * 5.63 AFN) = 438 + 281.5 = 719.5 AFN
        tier1_cost = 200 * 2.19
        tier2_cost = 50 * 5.63
        expected_cost = tier1_cost + tier2_cost
        self.assertAlmostEqual(data["total_cost"], expected_cost, places=2)
        
        # Verify breakdown
        self.assertEqual(len(data["breakdown"]), 2)
        
        # Tier 1 breakdown
        self.assertEqual(data["breakdown"][0]["tier"], "1-200")
        self.assertEqual(data["breakdown"][0]["usage"], 200)
        self.assertEqual(data["breakdown"][0]["rate"], 2.19)
        self.assertAlmostEqual(data["breakdown"][0]["cost"], tier1_cost, places=2)
        
        # Tier 2 breakdown
        self.assertEqual(data["breakdown"][1]["tier"], "201-400")
        self.assertEqual(data["breakdown"][1]["usage"], 50)
        self.assertEqual(data["breakdown"][1]["rate"], 5.63)
        self.assertAlmostEqual(data["breakdown"][1]["cost"], tier2_cost, places=2)
        
        print("✅ Residential multiple tiers calculation test passed")
    
    def test_kw_to_money_residential_all_tiers(self):
        """Test kW to money conversion for residential spanning all tiers"""
        # Test consumption spanning all tiers (3000kW)
        response = requests.post(
            f"{API_URL}/calculate/kw-to-money",
            params={
                "meter_type": "residential",
                "previous_reading": 1000,
                "current_reading": 4000  # 3000kW consumption
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify consumption
        self.assertEqual(data["consumption"], 3000)
        self.assertEqual(data["meter_type"], "residential")
        
        # Calculate expected cost across all tiers
        tier1_usage = 200
        tier2_usage = 200
        tier3_usage = 300
        tier4_usage = 1300
        tier5_usage = 1000
        
        tier1_cost = tier1_usage * 2.19
        tier2_cost = tier2_usage * 5.63
        tier3_cost = tier3_usage * 8.13
        tier4_cost = tier4_usage * 11.25
        tier5_cost = tier5_usage * 12.5
        
        expected_cost = tier1_cost + tier2_cost + tier3_cost + tier4_cost + tier5_cost
        self.assertAlmostEqual(data["total_cost"], expected_cost, places=2)
        
        # Verify breakdown (should have 5 tiers)
        self.assertEqual(len(data["breakdown"]), 5)
        
        print("✅ Residential all tiers calculation test passed")
    
    def test_kw_to_money_commercial(self):
        """Test kW to money conversion for commercial meter"""
        response = requests.post(
            f"{API_URL}/calculate/kw-to-money",
            params={
                "meter_type": "commercial",
                "previous_reading": 500,
                "current_reading": 800  # 300kW consumption
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify consumption
        self.assertEqual(data["consumption"], 300)
        self.assertEqual(data["meter_type"], "commercial")
        
        # Verify total cost: 300kW * 16.25 AFN = 4875 AFN
        expected_cost = 300 * 16.25
        self.assertAlmostEqual(data["total_cost"], expected_cost, places=2)
        
        # Verify breakdown
        self.assertEqual(len(data["breakdown"]), 1)
        self.assertEqual(data["breakdown"][0]["tier"], "0-∞")
        self.assertEqual(data["breakdown"][0]["usage"], 300)
        self.assertEqual(data["breakdown"][0]["rate"], 16.25)
        self.assertAlmostEqual(data["breakdown"][0]["cost"], expected_cost, places=2)
        
        print("✅ Commercial calculation test passed")
    
    def test_kw_to_money_factory(self):
        """Test kW to money conversion for factory meter"""
        response = requests.post(
            f"{API_URL}/calculate/kw-to-money",
            params={
                "meter_type": "factory",
                "previous_reading": 1000,
                "current_reading": 1500  # 500kW consumption
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify consumption
        self.assertEqual(data["consumption"], 500)
        self.assertEqual(data["meter_type"], "factory")
        
        # Verify total cost: 500kW * 6.75 AFN = 3375 AFN
        expected_cost = 500 * 6.75
        self.assertAlmostEqual(data["total_cost"], expected_cost, places=2)
        
        # Verify breakdown
        self.assertEqual(len(data["breakdown"]), 1)
        self.assertEqual(data["breakdown"][0]["tier"], "0-∞")
        self.assertEqual(data["breakdown"][0]["usage"], 500)
        self.assertEqual(data["breakdown"][0]["rate"], 6.75)
        self.assertAlmostEqual(data["breakdown"][0]["cost"], expected_cost, places=2)
        
        print("✅ Factory calculation test passed")
    
    def test_kw_to_money_invalid_input(self):
        """Test kW to money conversion with invalid inputs"""
        # Test with current reading less than previous reading
        response = requests.post(
            f"{API_URL}/calculate/kw-to-money",
            params={
                "meter_type": "residential",
                "previous_reading": 500,
                "current_reading": 300  # Invalid: current < previous
            }
        )
        self.assertEqual(response.status_code, 200)  # API returns 200 with error message
        data = response.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Current reading must be greater than previous reading")
        
        # Test with invalid meter type
        response = requests.post(
            f"{API_URL}/calculate/kw-to-money",
            params={
                "meter_type": "invalid_type",
                "previous_reading": 100,
                "current_reading": 300
            }
        )
        self.assertEqual(response.status_code, 200)  # API returns 200 with error message
        data = response.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Invalid meter type")
        
        print("✅ kW to money invalid input test passed")
    
    def test_money_to_kw_residential_tier1(self):
        """Test money to kW conversion for residential tier 1"""
        # Test with amount that falls within tier 1
        amount = 400  # Should be around 182.65kW at tier 1 rate (2.19 AFN)
        response = requests.post(
            f"{API_URL}/calculate/money-to-kw",
            params={
                "meter_type": "residential",
                "amount": amount
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify amount
        self.assertEqual(data["amount"], amount)
        self.assertEqual(data["meter_type"], "residential")
        
        # Verify total kW: 400 AFN / 2.19 AFN per kW ≈ 182.65 kW
        expected_kw = amount / 2.19
        self.assertAlmostEqual(data["total_kw"], round(expected_kw, 2), places=2)
        
        print("✅ Residential tier 1 money to kW test passed")
    
    def test_money_to_kw_residential_multiple_tiers(self):
        """Test money to kW conversion for residential spanning multiple tiers"""
        # Test with amount that spans tiers 1 and 2
        # Tier 1: 200kW * 2.19 AFN = 438 AFN
        # Tier 2: Remaining amount / 5.63 AFN
        amount = 1000
        response = requests.post(
            f"{API_URL}/calculate/money-to-kw",
            params={
                "meter_type": "residential",
                "amount": amount
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify amount
        self.assertEqual(data["amount"], amount)
        self.assertEqual(data["meter_type"], "residential")
        
        # Calculate expected kW
        tier1_cost = 200 * 2.19  # 438 AFN for first 200kW
        remaining_amount = amount - tier1_cost
        tier2_kw = remaining_amount / 5.63
        expected_kw = 200 + tier2_kw
        
        self.assertAlmostEqual(data["total_kw"], round(expected_kw, 2), places=2)
        
        print("✅ Residential multiple tiers money to kW test passed")
    
    def test_money_to_kw_commercial(self):
        """Test money to kW conversion for commercial meter"""
        amount = 1000
        response = requests.post(
            f"{API_URL}/calculate/money-to-kw",
            params={
                "meter_type": "commercial",
                "amount": amount
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify amount
        self.assertEqual(data["amount"], amount)
        self.assertEqual(data["meter_type"], "commercial")
        
        # Verify total kW: 1000 AFN / 16.25 AFN per kW ≈ 61.54 kW
        expected_kw = amount / 16.25
        self.assertAlmostEqual(data["total_kw"], round(expected_kw, 2), places=2)
        
        print("✅ Commercial money to kW test passed")
    
    def test_money_to_kw_factory(self):
        """Test money to kW conversion for factory meter"""
        amount = 1000
        response = requests.post(
            f"{API_URL}/calculate/money-to-kw",
            params={
                "meter_type": "factory",
                "amount": amount
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify amount
        self.assertEqual(data["amount"], amount)
        self.assertEqual(data["meter_type"], "factory")
        
        # Verify total kW: 1000 AFN / 6.75 AFN per kW ≈ 148.15 kW
        expected_kw = amount / 6.75
        self.assertAlmostEqual(data["total_kw"], round(expected_kw, 2), places=2)
        
        print("✅ Factory money to kW test passed")
    
    def test_money_to_kw_invalid_input(self):
        """Test money to kW conversion with invalid inputs"""
        # Test with negative amount
        response = requests.post(
            f"{API_URL}/calculate/money-to-kw",
            params={
                "meter_type": "residential",
                "amount": -100  # Invalid: negative amount
            }
        )
        self.assertEqual(response.status_code, 200)  # API returns 200 with error message
        data = response.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Amount must be greater than 0")
        
        # Test with invalid meter type
        response = requests.post(
            f"{API_URL}/calculate/money-to-kw",
            params={
                "meter_type": "invalid_type",
                "amount": 500
            }
        )
        self.assertEqual(response.status_code, 200)  # API returns 200 with error message
        data = response.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Invalid meter type")
        
        print("✅ Money to kW invalid input test passed")
    
    def test_calculation_storage_and_retrieval(self):
        """Test storing and retrieving calculations"""
        # First, clear all calculations
        self.clear_calculations()
        
        # Create a calculation
        calculation_data = {
            "calculation_type": "kw_to_money",
            "meter_type": "residential",
            "previous_reading": 100,
            "current_reading": 300,
            "consumption": 200,
            "total_cost": 438,
            "breakdown": [
                {
                    "tier": "1-200",
                    "usage": 200,
                    "rate": 2.19,
                    "cost": 438
                }
            ]
        }
        
        response = requests.post(
            f"{API_URL}/calculate",
            json=calculation_data
        )
        self.assertEqual(response.status_code, 200)
        created_calc = response.json()
        
        # Verify the calculation was stored with an ID
        self.assertIn("id", created_calc)
        
        # Retrieve calculations
        response = requests.get(f"{API_URL}/calculations")
        self.assertEqual(response.status_code, 200)
        calculations = response.json()
        
        # Verify we have at least one calculation
        self.assertGreaterEqual(len(calculations), 1)
        
        # Verify the calculation we created is in the list
        found = False
        for calc in calculations:
            if calc["id"] == created_calc["id"]:
                found = True
                self.assertEqual(calc["calculation_type"], calculation_data["calculation_type"])
                self.assertEqual(calc["meter_type"], calculation_data["meter_type"])
                self.assertEqual(calc["previous_reading"], calculation_data["previous_reading"])
                self.assertEqual(calc["current_reading"], calculation_data["current_reading"])
                self.assertEqual(calc["consumption"], calculation_data["consumption"])
                self.assertEqual(calc["total_cost"], calculation_data["total_cost"])
                break
        
        self.assertTrue(found, "Created calculation not found in retrieved calculations")
        
        print("✅ Calculation storage and retrieval test passed")
    
    def test_clear_calculations(self):
        """Test clearing all calculations"""
        # First, create a calculation
        calculation_data = {
            "calculation_type": "kw_to_money",
            "meter_type": "commercial",
            "previous_reading": 500,
            "current_reading": 800,
            "consumption": 300,
            "total_cost": 4875,
            "breakdown": [
                {
                    "tier": "0-∞",
                    "usage": 300,
                    "rate": 16.25,
                    "cost": 4875
                }
            ]
        }
        
        response = requests.post(
            f"{API_URL}/calculate",
            json=calculation_data
        )
        self.assertEqual(response.status_code, 200)
        
        # Verify we have at least one calculation
        response = requests.get(f"{API_URL}/calculations")
        self.assertEqual(response.status_code, 200)
        calculations_before = response.json()
        self.assertGreaterEqual(len(calculations_before), 1)
        
        # Clear all calculations
        response = requests.delete(f"{API_URL}/calculations")
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertIn("deleted_count", result)
        self.assertGreaterEqual(result["deleted_count"], 1)
        
        # Verify all calculations were cleared
        response = requests.get(f"{API_URL}/calculations")
        self.assertEqual(response.status_code, 200)
        calculations_after = response.json()
        self.assertEqual(len(calculations_after), 0)
        
        print("✅ Clear calculations test passed")


if __name__ == "__main__":
    print(f"Testing API at: {API_URL}")
    unittest.main(argv=['first-arg-is-ignored'], exit=False)