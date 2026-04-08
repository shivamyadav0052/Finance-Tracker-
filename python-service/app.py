from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import dotenv_values

config = dotenv_values(".env")

app = Flask(__name__)
CORS(app)


def analyze_expenses(expenses: list) -> list:
    """Main analysis function using Pandas."""
    if not expenses:
        return [{"type": "info", "message": "No expenses found in the last 30 days. Start adding expenses to get personalized suggestions!"}]

    df = pd.DataFrame(expenses)
    df['date'] = pd.to_datetime(df['date'])
    df['amount'] = pd.to_numeric(df['amount'])

    suggestions = []

    # 1. Total spending insight
    total = df['amount'].sum()
    suggestions.append({
        "type": "info",
        "icon": "💰",
        "message": f"You spent ₹{total:,.0f} in the last 30 days across {len(df)} transactions."
    })

    # 2. Category analysis — top spender
    cat_totals = df.groupby('category')['amount'].sum().sort_values(ascending=False)
    if not cat_totals.empty:
        top_cat = cat_totals.index[0]
        top_val = cat_totals.iloc[0]
        pct = (top_val / total * 100) if total > 0 else 0
        suggestions.append({
            "type": "warning" if pct > 35 else "info",
            "icon": "⚠️" if pct > 35 else "📊",
            "message": f"Your highest spending category is {top_cat} at ₹{top_val:,.0f} ({pct:.1f}% of total). {'Consider reducing it by 15%.' if pct > 35 else 'Keep it balanced!'}"
        })

    # 3. Week-over-week trend (if enough data)
    if len(df) >= 5:
        now = df['date'].max()
        last_week = df[df['date'] >= now - timedelta(days=7)]['amount'].sum()
        prev_week = df[(df['date'] >= now - timedelta(days=14)) & (df['date'] < now - timedelta(days=7))]['amount'].sum()
        if prev_week > 0:
            change_pct = ((last_week - prev_week) / prev_week) * 100
            if change_pct > 20:
                suggestions.append({
                    "type": "warning",
                    "icon": "📈",
                    "message": f"Your spending increased by {change_pct:.1f}% this week compared to last week (₹{last_week:,.0f} vs ₹{prev_week:,.0f}). Watch out!"
                })
            elif change_pct < -20:
                suggestions.append({
                    "type": "success",
                    "icon": "📉",
                    "message": f"Great job! Your spending decreased by {abs(change_pct):.1f}% this week. You saved ₹{prev_week - last_week:,.0f}."
                })

    # 4. Payment method insight
    method_counts = df.groupby('paymentMethod')['amount'].sum().sort_values(ascending=False)
    if not method_counts.empty:
        top_method = method_counts.index[0]
        if top_method == 'Credit Card':
            suggestions.append({
                "type": "tip",
                "icon": "💳",
                "message": f"You rely heavily on Credit Card payments. Make sure you're paying off the balance to avoid interest charges."
            })
        elif top_method == 'Cash':
            suggestions.append({
                "type": "tip",
                "icon": "💵",
                "message": f"You mostly use Cash. Consider switching to UPI for better expense tracking."
            })

    # 5. High-frequency small spending (impulse buys)
    small_txns = df[df['amount'] < 200]
    if len(small_txns) > 10:
        small_total = small_txns['amount'].sum()
        suggestions.append({
            "type": "tip",
            "icon": "🛒",
            "message": f"You have {len(small_txns)} small transactions (under ₹200) totaling ₹{small_total:,.0f}. These impulse purchases add up fast!"
        })

    # 6. Category-specific advice
    if 'Food' in cat_totals and cat_totals['Food'] > 5000:
        suggestions.append({
            "type": "tip",
            "icon": "🍔",
            "message": f"Food spending is ₹{cat_totals['Food']:,.0f}. Try meal prepping or cooking at home to cut costs."
        })
    if 'Shopping' in cat_totals and cat_totals['Shopping'] > 3000:
        suggestions.append({
            "type": "tip",
            "icon": "🛍️",
            "message": f"Shopping at ₹{cat_totals['Shopping']:,.0f}. Consider a 24-hour rule before making non-essential purchases."
        })
    if 'Entertainment' in cat_totals and cat_totals['Entertainment'] > 2000:
        suggestions.append({
            "type": "tip",
            "icon": "🎬",
            "message": f"Entertainment expenses are ₹{cat_totals['Entertainment']:,.0f}. Look for free events or discount days."
        })

    # 7. Savings suggestion
    potential_savings = total * 0.10
    suggestions.append({
        "type": "success",
        "icon": "🎯",
        "message": f"If you cut spending by just 10%, you could save ₹{potential_savings:,.0f} this month. Start with your top category!"
    })

    return suggestions


@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Finance Tracker Python Service ", "version": "1.0.0"})


@app.route('/suggest', methods=['POST'])
def suggest():
    try:
        data = request.get_json()
        if not data or 'expenses' not in data:
            return jsonify({"error": "expenses array required"}), 400

        expenses = data['expenses']
        suggestions = analyze_expenses(expenses)

        return jsonify({
            "suggestions": suggestions,
            "analyzed_count": len(expenses),
            "source": "pandas-analysis",
            "generated_at": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/analyze', methods=['POST'])
def analyze():
    """Detailed analysis endpoint."""
    try:
        data = request.get_json()
        expenses = data.get('expenses', [])
        if not expenses:
            return jsonify({"summary": {}, "suggestions": []})

        df = pd.DataFrame(expenses)
        df['date'] = pd.to_datetime(df['date'])
        df['amount'] = pd.to_numeric(df['amount'])

        summary = {
            "total": float(df['amount'].sum()),
            "average_per_day": float(df['amount'].sum() / 30),
            "transaction_count": len(df),
            "by_category": df.groupby('category')['amount'].sum().to_dict(),
            "by_payment_method": df.groupby('paymentMethod')['amount'].sum().to_dict(),
            "daily_trend": df.groupby(df['date'].dt.date)['amount'].sum().reset_index().rename(
                columns={'date': 'date', 'amount': 'total'}
            ).assign(date=lambda x: x['date'].astype(str)).to_dict('records')
        }

        suggestions = analyze_expenses(expenses)
        return jsonify({"summary": summary, "suggestions": suggestions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
