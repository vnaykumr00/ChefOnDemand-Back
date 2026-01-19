import { supabase } from '../config/supabase.js';

const getPricingRules = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pricing_rules')
            .select('*');

        if (error) throw error;

        // Convert array to object for easier frontend lookup { RuleName: Value }
        const rules = {};
        data.forEach(rule => {
            // Convert numeric string to number
            rules[rule.RuleName] = Number(rule.Value);
        });

        res.json(rules);
    } catch (error) {
        console.error('Error fetching pricing rules:', error);
        res.status(500).json({ error: 'Failed to fetch pricing rules' });
    }
};

export default {
    getPricingRules
};
