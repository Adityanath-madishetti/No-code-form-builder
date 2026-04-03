Logic Panel:
1. Search Bar: To search for the name of the rule
2. Create Rule Section: 
	- You can combine these rules with AND and OR operators to allow for multiple conditions. 
	- You can perform multiple actions, one after the other in `THEN` block.
	- (Nesting different rules - Save for later. Do when time permits)
	  
	  Rule Creation should be done in the Logic Page. But you can select the type of rule in the side panel.

	- Type 1: Rules for and Component Properties / Fields
		- `IF [COMPONENT-1].value [OPERATOR] [VALUE]`:
		- `THEN for [COMPONENT-2].property, [ACTION] [VALUE]`

	- Type 2: Rules for Computation of Data
		- This creates data that can be computed automatically. 

	- Type 3: Validation Rules
		- This creates rules to check if certain conditions are met. If they aren't you can disable form submission and also an error message at the field. And maybe can't proceed to the next page as well.
	
	- Type 4: Page Rules (Navigation Rules)
		- To decide which page to go next based on the options on the previously selected options.  

3. Rules Section: View rules that have been created based on the type of the rule
4. Filter & Sort options: to the left of the search bar to search for rules of a particular rule, and to sort rules based on name, and last modified fields
5. Right Click: On a rules allows for open, rename, delete options
6. Option Shuffling: A property for selection components
7. Component Shuffling: Create component stacks with component shuffling as property
