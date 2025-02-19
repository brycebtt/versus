const productHeaders = document.querySelectorAll(".product-header");
const cartToggle = document.getElementById("cart-toggle");
const cartPanel = document.getElementById("cart");
const cartItems = document.getElementById("cart-items");
const categoryBtns = document
    .getElementById("categories")
    .querySelector(".btn-group");
const productList = document.getElementById("product-list");
const productsListLabel = document.getElementById("product-intro");
const totalPrice = document.getElementById("total-price");
const netProfitMargin = document.getElementById("net-profit-margin");
const lowMarginMeter = document.querySelector(".low");
const normalMarginMeter = document.querySelector(".normal");
const highMarginMeter = document.querySelector(".high");
const IndicatorMarginMeter = document.querySelector(".indicator");
const root = document.documentElement;
const footer = document.querySelector("footer");
const cartDiscountBtnContainer = document.querySelector(
    ".cart-price-discounts"
);
const cartDiscountBtns = document.querySelectorAll(".discount-btn");

const copyTextBtn = document.getElementById("copy-text-btn");
const copyDropdown = document.getElementById("copy-dropdown");
const copyContainer = document.getElementById("copy-container");
const copyIcon = copyTextBtn.querySelector("img");
const overlay = document.getElementById("overlay");
const copyCustomerBtn = document.getElementById("copy-customer-btn");
const copyBusinessBtn = document.getElementById("copy-business-btn");
const emptyCartText = document.getElementById("empty-cart");
const feedbackContainer = document.getElementById("feedback-container");

class Choice {
    id;
    label;

    constructor(choiceData) {
        this.id = choiceData.id;
        this.label = choiceData.label;
    }
}

class Option {
    id;
    name;
    type;
    required;

    constructor(optionData) {
        this.id = optionData.id;
        this.name = optionData.name;
        this.type = optionData.type;
        this.required = optionData.required;

        if (this.type != "boolean") {
            optionData.choices.forEach((cho) => {
                const choice = new Choice(cho);
                if (!this.choices) this.choices = [];
                this.choices.push(choice);
            });
        } else {
            this.cost = optionData.cost;
            this.price = optionData.price;
        }
    }
}

class Factory {
    id;
    name;
    baseCost;
    basePrice;
    costOverrides = [];

    constructor(factoryData) {
        this.id = factoryData.id;
        this.name = factoryData.name;
        this.baseCost = factoryData.baseCost;
        this.basePrice = factoryData.basePrice;

        factoryData.costOverrides.forEach((co) => {
            this.costOverrides.push(co);
        });
    }
}

class Category {
    id;
    name;
    productIds;
    packages = [];

    constructor(categoryData) {
        this.id = categoryData.id;
        this.name = categoryData.name;
        this.productIds = categoryData.productIds;

        if (categoryData.packages) {
            categoryData.packages.forEach((p) => {
                const pack = new Package(p);
                this.packages.push(pack);
            });
        }
    }
}

class Product {
    id;
    name;
    productionType;
    factories = [];
    options = []; // free options such as collar type

    constructor(productData) {
        this.id = productData.id;
        this.name = productData.name;
        this.productionType = productData.productionType;

        productData.factories.forEach((fac) => {
            const factory = new Factory(fac);
            this.factories.push(factory);
        });

        productData.options.forEach((opt) => {
            const option = new Option(opt);
            this.options.push(option);
        });
    }
}

class Package {
    id;
    name;
    items;

    constructor(packageData) {
        this.id = packageData.id;
        this.name = packageData.name;
        this.items = packageData.products;
    }
}

class CustomPackage {
    name;
    package;
    items = [];
    currentCost = 0;
    currentPrice = 0;

    constructor(pack, items) {
        this.package = pack;
        this.items = items;
        this.name = pack.name;
    }

    // Add up costs and price of Custom Products
    recalc() {
        this.currentCost = 0;
        this.currentPrice = 0;

        this.items.forEach((item) => {
            item.recalc();
            this.currentCost += item.currentCost;
            this.currentPrice += item.currentPrice;
        });
    }

    validateRequired() {
        return this.items.every((item) => {
            return item.validateRequired();
        });
    }
    resetState() {
        this.items.forEach((item) => item.resetState());
        this.currentPrice = 0;
        this.currentCost = 0;
    }
}

class CustomProduct {
    name;
    product;
    selectedFactoryId = null;
    factoryKey = null;
    selectedOptions = {};
    currentCost = 0;
    currentPrice = 0;
    inCart = false;

    constructor(product, onAddToCart) {
        this.product = product;
        this.name = product.name;

        if (onAddToCart) this.onAddToCart = onAddToCart;

        // If product only has 1 factory, make it the selected factory
        if (this.product.factories.length === 1) {
            this.selectedFactoryId = this.product.factories[0].id;
        }
    }

    addToCart() {
        const cloneProduct = this.clone();
        cloneProduct.inCart = true;
        this.onAddToCart(cloneProduct);
    }

    recalc() {
        const factory = this.product.factories.find(
            (factory) => factory.id === this.selectedFactoryId
        );

        if (!factory) return;

        let cost = factory.baseCost;
        let price = factory.basePrice;

        Object.entries(this.selectedOptions).forEach(([optionId, choiceId]) => {
            factory.costOverrides.forEach((co) => {
                // handles multiple-choice options
                if (choiceId instanceof Array) {
                    choiceId.forEach((choice) => {
                        if (
                            choice === co.choiceId &&
                            optionId === co.optionId
                        ) {
                            cost += co.cost;
                            price += co.price;
                        }
                    });
                } else if (
                    choiceId === co.choiceId &&
                    optionId === co.optionId
                ) {
                    cost += co.cost;
                    price += co.price;
                }
            });
        });

        this.currentCost = cost;

        // Dont change update price if in cart
        if (this.inCart) return;

        this.currentPrice = price;
    }

    validateRequired() {
        if (!this.selectedFactoryId) return false;

        const validate = this.product.options.every((option) => {
            if (option.required) {
                if (!this.selectedOptions[option.id]) return false;
            }

            return true;
        });

        return validate;
    }

    clone() {
        const cloneProduct = new CustomProduct(this.product);
        cloneProduct.name = this.name;
        cloneProduct.categoryName = this.categoryName;
        cloneProduct.selectedFactoryId = this.selectedFactoryId;
        cloneProduct.selectedOptions = this.selectedOptions;
        cloneProduct.currentCost = this.currentCost;
        cloneProduct.currentPrice = this.currentPrice;

        return cloneProduct;
    }

    resetState() {
        // dont reset factoryId of products with only 1 factory option
        if (this.product.factories.length > 1) this.selectedFactoryId = null;
        this.selectedOptions = {};
        this.currentPrice = 0;
        this.currentCost = 0;
    }
}

class ListingUIState {
    item;
    itemEl;

    constructor(item) {
        this.item = item;
    }

    createItemForm() {
        const itemEl = document.createElement("div");
        itemEl.classList.add("product-item");

        this.itemEl = itemEl;

        // Add header to product element
        const productHeader = document.createElement("div");
        productHeader.classList.add("product-header");
        productHeader.innerHTML = `<div class="dropdown-arrow">
                                    <img src="images/dropdown-arrow.svg" height="12px" width="6.87px" />
                                </div>
                                 <h3>${this.item.name}</h3>`;
        itemEl.appendChild(productHeader);

        // Create options form
        const optionsForm = document.createElement("form");
        optionsForm.classList.add("product-options");

        return optionsForm;
    }

    createAddToCartBtn() {
        const addToCartBtn = document.createElement("label");
        addToCartBtn.classList.add("cart-submit", "disabled");
        addToCartBtn.innerHTML =
            'Add to Cart ($<span>0.00</span>) <input type="submit" disabled />';

        return addToCartBtn;
    }

    createFactoryOptionGroup(product, key) {
        const optionGroup = document.createElement("div");
        optionGroup.classList.add("option-group");

        if (key) {
            optionGroup.setAttribute("data-factories", key);
        }

        const optionGroupLabel = document.createElement("label");
        optionGroupLabel.innerText = "Factory Selection *";

        const optionBtnGroup = document.createElement("div");
        optionBtnGroup.classList.add("btn-group");

        product.factories.forEach((factory) => {
            const optionSelection = document.createElement("div");
            optionSelection.classList.add("option-selection", "btn-main");

            const optionInput = document.createElement("input");
            optionInput.setAttribute("type", "radio");
            optionInput.setAttribute("name", "factory");
            optionInput.setAttribute("id", factory.id);

            const optionLabel = document.createElement("label");
            optionLabel.setAttribute("for", factory.id);
            optionLabel.innerText = `${factory.name}`;

            optionSelection.appendChild(optionInput);
            optionSelection.appendChild(optionLabel);

            optionBtnGroup.appendChild(optionSelection);
        });

        optionGroup.appendChild(optionGroupLabel);
        optionGroup.appendChild(optionBtnGroup);

        return optionGroup;
    }

    createOptionGroup(option, key, index, copyIndex = 1) {
        const optionGroup = document.createElement("div");
        optionGroup.classList.add("option-group");

        if (key) {
            optionGroup.setAttribute("data-factories", key);
            optionGroup.setAttribute("data-i", index);
        }

        const optionGroupLabel = document.createElement("label");
        optionGroupLabel.innerText = `${option.name} ${
            copyIndex > 1 ? copyIndex : ""
        } ${option.type === "single-choice" ? "(Choose One)" : ""}${
            option.required ? " *" : ""
        }`;

        const optionBtnGroup = document.createElement("div");
        optionBtnGroup.classList.add("btn-group");

        option.choices.forEach((choice) => {
            const optionSelection = document.createElement("div");
            optionSelection.classList.add("option-selection", "btn-main");

            const optionInput = document.createElement("input");
            const optionLabel = document.createElement("label");
            optionLabel.setAttribute("for", choice.id);

            optionInput.setAttribute(
                "type",
                `${option.type === "single-choice" ? "radio" : "checkbox"}`
            );
            optionInput.setAttribute(
                "name",
                `${option.id + (copyIndex > 1 ? copyIndex : "")}`
            );
            optionInput.setAttribute("id", choice.id);

            // update option for checkbox selections
            if (optionInput.getAttribute("type") === "checkbox") {
                optionLabel.innerHTML = `<span class="checkmark"></span>${choice.label} (+$<span class="option-price">XX</span>)`;
            } else {
                optionLabel.innerHTML = `${choice.label} ($<span class="option-price">XX</span>)`;
            }

            // Need to disable if requires factory selection

            optionSelection.appendChild(optionInput);
            optionSelection.appendChild(optionLabel);

            optionBtnGroup.appendChild(optionSelection);
        });

        optionGroup.appendChild(optionGroupLabel);
        optionGroup.appendChild(optionBtnGroup);

        return optionGroup;
    }

    updateLabels(singleItem) {
        const factory = singleItem.product.factories.find(
            (factory) => factory.id === singleItem.selectedFactoryId
        );

        // Option prices are XX if no factory is selected
        if (!factory) {
            const options = this.itemEl.querySelectorAll(".option-selection");

            if (!options) return;

            options.forEach((option) => {
                const labelEl = option.querySelector("label");
                if (labelEl.getAttribute("for").slice(0, 7) != "factory") {
                    const labelPrice = labelEl.querySelector(".option-price");
                    labelPrice.innerText = "XX";
                }
            });
            return;
        }

        // Option prices determined by selected factory
        factory.costOverrides.forEach((co) => {
            const labelEl = this.itemEl.querySelectorAll(
                `label[for="${co.choiceId}"]`
            );
            if (!labelEl) return;

            labelEl.forEach((label) => {
                const labelPrice = label.querySelector(".option-price");
                if (!labelPrice) return;

                labelPrice.innerText = `${co.price.toFixed(2)}`;
            });
        });
    }

    // Update add to cart price label on option or factory change
    updateTotalPrice() {
        const addToCartBtn = this.itemEl.querySelector(".cart-submit");
        if (!addToCartBtn) return;

        const totalPriceLabel = addToCartBtn.querySelector("span");
        if (!totalPriceLabel) return;

        // Enable cart if all required options are selected
        if (this.item.validateRequired()) {
            addToCartBtn.classList.remove("disabled");
            addToCartBtn.querySelector("input").disabled = false;
        } else {
            addToCartBtn.classList.add("disabled");
            addToCartBtn.querySelector("input").disabled = true;
        }

        totalPriceLabel.innerText = this.item.currentPrice.toFixed(2);
    }

    updateDropdownHeight() {
        if (this.itemEl.classList.contains("open")) {
            const productOptions =
                this.itemEl.querySelector(".product-options");
            productOptions.style.maxHeight = productOptions.scrollHeight + "px";
        }
    }
}

class PackageUIState extends ListingUIState {
    constructor(item) {
        super(item);

        this.createListingForm();

        if (this.item.items.some((product) => product.selectedFactoryId)) {
            this.updatePackageLabels();
        }

        this.attachListeners();
    }

    createListingForm() {
        const optionsForm = this.createItemForm();

        // If products have matching factory options, list under 1 factory selection (unless only 1 factory)

        const itemFactoriesArr = [];

        // Create array with products grouped with their array of factories ids
        this.item.items.forEach((item, i) => {
            const product = item.product;
            const itemFactoryIds = {
                product: item,
                factories: [],
            };
            product.factories.forEach((factory) => {
                itemFactoryIds.factories.push(factory.id);
            });
            itemFactoriesArr.push(itemFactoryIds);
        });

        // Sort products together if they have the same factory options
        const groupedProducts = Object.groupBy(itemFactoriesArr, (product) => {
            return [...product.factories].sort().join("_");
        });

        Object.entries(groupedProducts).forEach(([key, factoryGroup]) => {
            // Add factory selection (if there are multiple options)
            if (factoryGroup[0].factories.length > 1) {
                const optionGroup = this.createFactoryOptionGroup(
                    // factory group product -> CustomProduct -> actual product
                    factoryGroup[0].product.product,
                    key
                );
                optionsForm.appendChild(optionGroup);
            } else {
                // If only 1 factory is available, set selectedFactoryId to that factory
                factoryGroup.forEach((group) => {
                    group.product.selectedFactoryId = group.factories[0];
                });
            }

            // Add product option groups
            factoryGroup.forEach((group) => {
                // assign factory key to specific product
                group.product.factoryKey = key;
                group.product.product.options.forEach((option) => {
                    const optionGroup = this.createOptionGroup(
                        option,
                        key,
                        this.item.items.indexOf(group.product),
                        group.product.copyIndex
                    );
                    optionsForm.appendChild(optionGroup);
                });
            });
        });

        // Create add to cart button
        const addToCartBtn = this.createAddToCartBtn();
        optionsForm.appendChild(addToCartBtn);

        this.itemEl.appendChild(optionsForm);

        // Add listing to main products list
        productList.appendChild(this.itemEl);
    }

    updatePackageLabels() {
        this.item.items.forEach((item) => {
            this.updateLabels(item);
        });
        this.updateDropdownHeight();
    }

    attachListeners() {
        const optionsForm = this.itemEl.querySelector(".product-options");

        optionsForm.addEventListener("change", (e) => {
            const target = e.target;
            this.handleChangeEvent(target);
        });

        optionsForm.addEventListener("submit", (e) => {
            e.preventDefault();

            this.item.items.forEach((item) => item.addToCart());

            // Reset product listing
            optionsForm.reset();
            this.resetState();
        });
    }

    handleChangeEvent(target) {
        // Removes any numbers from end of copy product options (jersey-style2, etc.)
        const targetName = target.name.replaceAll(/[0-9]/g, "");

        if (targetName === "factory") {
            const optionGroup = target.closest(".option-group");
            const factoryKey = optionGroup.getAttribute("data-factories");
            this.item.items.forEach((item) => {
                if (item.factoryKey === factoryKey) {
                    item.selectedFactoryId = target.id;
                }
            });
            this.updatePackageLabels();
        }

        if (targetName != "factory") {
            const itemIndex = target
                .closest(".option-group")
                .getAttribute("data-i");

            const productItem = this.item.items[itemIndex];
            // single-choice options
            if (target.type === "radio") {
                productItem.selectedOptions[`${targetName}`] = target.id;
            }

            // multiple-choice options
            if (target.type === "checkbox") {
                // create array object if not already initialized
                if (!productItem.selectedOptions[`${targetName}`]) {
                    productItem.selectedOptions[`${targetName}`] = [];
                }

                // Add item to array if checked, remove from array if unchecked
                if (target.checked) {
                    productItem.selectedOptions[`${targetName}`].push(
                        target.id
                    );
                } else {
                    productItem.selectedOptions[`${targetName}`] =
                        productItem.selectedOptions[`${targetName}`].filter(
                            (option) => option != target.id
                        );
                }

                // Delete array if empty
                if (productItem.selectedOptions[`${targetName}`].length === 0) {
                    delete productItem.selectedOptions[`${targetName}`];
                }
            }
        }

        this.item.recalc();
        this.updateTotalPrice();
    }

    resetState() {
        this.item.resetState();
        this.updatePackageLabels();
        this.updateTotalPrice();
    }
}

class ProductUIState extends ListingUIState {
    constructor(item) {
        super(item);

        this.createListingForm();

        if (this.item.selectedFactoryId) {
            this.updateProductLabels();

            if (this.item.product.options.every((option) => !option.required)) {
                this.item.recalc();
                this.updateTotalPrice();
            }
        }

        this.attachListeners();
    }

    updateProductLabels() {
        this.updateLabels(this.item);
        this.updateDropdownHeight();
    }

    attachListeners() {
        const optionsForm = this.itemEl.querySelector(".product-options");

        optionsForm.addEventListener("change", (e) => {
            const target = e.target;
            this.handleChangeEvent(target);
        });

        optionsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            this.item.addToCart();

            // Reset product listing
            optionsForm.reset();
            this.resetState();
        });
    }

    handleChangeEvent(target) {
        if (target.name === "factory") {
            this.item.selectedFactoryId = target.id;
            this.item.recalc();
            this.updateProductLabels();
            this.updateTotalPrice();
        }

        if (target.name != "factory") {
            // single-choice options
            if (target.type === "radio") {
                this.item.selectedOptions[`${target.name}`] = target.id;
            }

            // multiple-choice options
            if (target.type === "checkbox") {
                // create array object if not already initialized
                if (!this.item.selectedOptions[`${target.name}`]) {
                    this.item.selectedOptions[`${target.name}`] = [];
                }

                // Add item to array if checked, remove from array if unchecked
                if (target.checked) {
                    this.item.selectedOptions[`${target.name}`].push(target.id);
                } else {
                    this.item.selectedOptions[`${target.name}`] =
                        this.item.selectedOptions[`${target.name}`].filter(
                            (option) => option != target.id
                        );
                }

                // Delete array if empty
                if (this.item.selectedOptions[`${target.name}`].length === 0) {
                    delete this.item.selectedOptions[`${target.name}`];
                }
            }

            this.item.recalc();
            this.updateTotalPrice();
        }
    }

    // Add product to product list
    createListingForm() {
        const optionsForm = this.createItemForm();

        // Add factory selection (if there are multiple options)
        if (this.item.product.factories.length > 1) {
            const optionGroup = this.createFactoryOptionGroup(
                this.item.product
            );
            optionsForm.appendChild(optionGroup);
        } else {
            // If only 1 factory is available, set selectedFactoryId to that factory
            this.item.selectedFactoryId = this.item.product.factories.at(0).id;
        }

        // Add other option groups
        this.item.product.options.forEach((option) => {
            const optionGroup = this.createOptionGroup(option);
            optionsForm.appendChild(optionGroup);
        });

        // Create add to cart button
        const addToCartBtn = this.createAddToCartBtn();
        optionsForm.appendChild(addToCartBtn);

        this.itemEl.appendChild(optionsForm);

        // Add listing to main products list
        productList.appendChild(this.itemEl);
    }

    resetState() {
        this.item.resetState();

        if (this.item.selectedFactoryId) {
            this.updateProductLabels();

            if (this.item.product.options.every((option) => !option.required)) {
                this.item.recalc();
            }
        }
        this.updateTotalPrice();
    }
}

class CartItemUI {
    item;
    profitMargin;

    constructor(item) {
        this.item = item;
        this.calcProfitMargin();

        this.cartEl = this.createCartForm();

        cartItems.appendChild(this.cartEl);
    }

    // Calculates currentCost currentPrice and profitMargin
    // Switch to using CustomProduct / CustomPackage recalc() for currentCost
    recalc() {
        this.calcProfitMargin();
        this.updateCartEl();
    }

    calcProfitMargin() {
        this.profitMargin =
            ((this.item.currentPrice - this.item.currentCost) /
                this.item.currentPrice) *
                100 || 0;

        // If profit margin is infinite, set to 0 for simplicity
        if (this.profitMargin === -Infinity) this.profitMargin = 0;
    }

    // Updates cart ui with currentPrice and profitMargin
    updateCartEl() {
        const itemProfitMargin = this.cartEl
            .querySelector(".item-profit-margin")
            .querySelector("span");
        const itemPriceInput = this.cartEl
            .querySelector(".cart-price-input")
            .querySelector("input");

        itemProfitMargin.textContent = this.profitMargin.toFixed(2);
        itemPriceInput.textContent = this.item.currentPrice.toFixed(2);
    }

    createCartForm() {
        const cartEl = document.createElement("div");
        cartEl.classList.add("cart-item");
        cartEl.setAttribute("data-cart-id", this.item.cartId);

        const cartItemTop = document.createElement("div");
        cartItemTop.classList.add("cart-item-top");
        cartEl.appendChild(cartItemTop);

        const cartItemInfo = document.createElement("div");
        cartItemInfo.classList.add("cart-product-info");

        const cartHeader = document.createElement("h3");
        cartHeader.innerText = this.item.name;
        cartItemInfo.appendChild(cartHeader);

        const cartProductSelections = document.createElement("div");
        cartProductSelections.classList.add("cart-product-selections");
        cartItemInfo.appendChild(cartProductSelections);

        Object.values(this.item.selectedOptions).forEach((choiceId) => {
            if (choiceId instanceof Array) {
                choiceId.forEach((choice) => {
                    for (const option of this.item.product.options) {
                        const optionChoice = option.choices.find(
                            (cho) => cho.id === choice
                        );

                        if (!optionChoice) continue;

                        // Create label for each choice in multiple choice options
                        const optionLabel = document.createElement("p");
                        optionLabel.innerText = optionChoice.label;
                        cartProductSelections.appendChild(optionLabel);
                    }
                });
            } else {
                for (const option of this.item.product.options) {
                    const optionChoice = option.choices.find(
                        (choice) => choice.id === choiceId
                    );

                    if (!optionChoice) continue;

                    const optionLabel = document.createElement("p");
                    optionLabel.innerText = optionChoice.label;
                    cartProductSelections.appendChild(optionLabel);
                }
            }
        });

        cartItemTop.appendChild(cartItemInfo);

        const cartItemPrice = document.createElement("div");
        cartItemPrice.classList.add("cart-item-price");
        cartItemPrice.innerHTML = `<div class="cart-price-control">
                                        <button class="price-decrement">
                                             <img src="images/-.svg" width="12px" height="2px" />
                                        </button>
                                         <div class="cart-price-input">
                                            <span>$</span>
                                            <input
                                                type="number"
                                                inputmode="decimal"
                                                id="price"
                                                value="${this.item.currentPrice.toFixed(
                                                    2
                                                )}"
                                                autocomplete="off"
                                                data-prev="${this.item.currentPrice.toFixed(
                                                    2
                                                )}"
                                            />
                                        </div>
                                        <button class="price-increment">
                                            <img src="images/+.svg" width="12px" height="13px" />
                                        </button>
                                    </div>`;

        cartItemTop.appendChild(cartItemPrice);

        const cartItemBottom = document.createElement("div");
        cartItemBottom.classList.add("cart-item-bottom");
        cartItemBottom.innerHTML = `<div class="cart-product-options">
                                        <div class="cart-factory">
                                            <p>Factory:</p>
                                            <div class="btn-group">
                                            </div>
                                        </div>
                                        <div class="item-profit-margin">
                                            <p>
                                                Profit Margin: <span>${this.profitMargin.toFixed(
                                                    2
                                                )}</span>%
                                            </p>
                                        </div>
                                    </div>
                                    <button class="remove-btn">Remove</button>`;

        const cartItemFactoryOptions =
            cartItemBottom.querySelector(".btn-group");
        this.item.product.factories.forEach((factory) => {
            const optionSelection = document.createElement("div");
            optionSelection.classList.add("option-selection", "btn-main");
            optionSelection.innerHTML = `<input
                                            type="radio"
                                            name="factory-${this.item.cartId}"
                                            id="${factory.id}"
                                        />
                                        <label for="${factory.id}">${factory.name}</label>`;

            if (factory.id === this.item.selectedFactoryId) {
                const optionInput = optionSelection.querySelector("input");
                optionInput.checked = true;
            }

            cartItemFactoryOptions.appendChild(optionSelection);
        });

        cartEl.appendChild(cartItemBottom);

        return cartEl;
    }

    delete() {
        this.cartEl.remove();
    }
}

class Cart {
    items = [];
    cartElItems = [];
    static idCounter = 0;
    totalCost = 0;
    totalPrice = 0;
    totalProfitMargin = 0;
    floorProfitMargin = 0;
    highProfitMargin = 0;
    discountPercent = 0;

    constructor(floorProfitMargin, highProfitMargin) {
        this.addToCart = this.addToCart.bind(this);
        this.floorProfitMargin = floorProfitMargin;
        this.highProfitMargin = highProfitMargin;
        this.initMarginMeter();
        this.attachListeners();
        this.updateTotalsUI();
    }

    addToCart(item) {
        this.items.push(item);
        // Assign id to item then increment it
        item.cartId = Cart.idCounter++;
        this.cartElItems.push(new CartItemUI(item));
        this.updateTotalsUI();

        // Show copy text button
        emptyCartText.classList.add("hidden");
        copyTextBtn.style.opacity = "1";
        copyTextBtn.disabled = false;

        this.showFeedbackMessage("Added to Cart");
    }

    removeFromCart(itemObject, cartItem) {
        const itemIndex = this.items.indexOf(itemObject);
        this.items.splice(itemIndex, 1);
        this.cartElItems.splice(itemIndex, 1);
        cartItem.delete();
        this.updateTotalsUI();

        // Hide copy text button if neccesary
        if (this.items.length === 0) {
            emptyCartText.classList.remove("hidden");
            copyTextBtn.style.opacity = "0";
            copyTextBtn.disabled = true;
        }
    }

    calcTotalCost() {
        this.totalCost = this.items.reduce(
            (acc, item) => acc + item.currentCost,
            0
        );
    }

    calcTotalPrice() {
        this.totalPrice =
            (this.items.reduce((acc, item) => acc + item.currentPrice, 0) ||
                0) *
            (1 - this.discountPercent);
    }

    calcTotalProfitMargin() {
        this.totalProfitMargin =
            ((this.totalPrice - this.totalCost) / this.totalPrice) * 100 || 0;

        // If profit margin is infinite, set to 0 for simplicity
        if (this.totalProfitMargin === -Infinity) this.totalProfitMargin = 0;
    }

    calcTotals() {
        this.calcTotalCost();
        this.calcTotalPrice();
        this.calcTotalProfitMargin();
    }

    setDiscount(percent) {
        this.discountPercent = percent;
        this.updateTotalsUI();
    }

    removeDiscount() {
        this.discountPercent = 0;
        this.updateTotalsUI();
    }

    updateTotalsUI() {
        this.calcTotals();
        totalPrice.innerText = this.totalPrice.toFixed(2);
        netProfitMargin.innerText = this.totalProfitMargin.toFixed(2);
        this.updateMarginMeter();
    }

    initMarginMeter() {
        lowMarginMeter.style.width = this.floorProfitMargin + "%";
        normalMarginMeter.style.width =
            100 -
            (this.floorProfitMargin + (100 - this.highProfitMargin)) +
            "%";
        highMarginMeter.style.width = 100 - this.highProfitMargin + "%";
    }

    updateMarginMeter() {
        if (this.totalProfitMargin <= this.floorProfitMargin) {
            netProfitMargin.style.color =
                getComputedStyle(root).getPropertyValue("--mainRed");
        } else if (this.totalProfitMargin >= this.highProfitMargin) {
            netProfitMargin.style.color = "#20c82b";
        } else {
            netProfitMargin.style.color = "white";
        }

        IndicatorMarginMeter.style.left = this.totalProfitMargin + "%";
    }

    showFeedbackMessage(message, duration = 1000) {
        feedbackContainer.querySelector("#feedback-message").textContent =
            message;
        feedbackContainer.style.transition = "opacity 20ms ease";
        feedbackContainer.style.opacity = "1";

        // Force a reflow/repaint to make the "none" transition take effect
        void feedbackContainer.offsetWidth;

        feedbackContainer.style.transition = "opacity 1s ease";

        // Fade out after the duration
        setTimeout(() => {
            feedbackContainer.style.opacity = "0";
        }, duration);
    }

    attachListeners() {
        // Cart item price + - buttons
        cartItems.addEventListener("click", (e) => {
            const cartItem = e.target.closest(".cart-item");
            if (!cartItem) return;

            const cartId = Number(cartItem.getAttribute("data-cart-id"));

            const itemObject = this.items.find(
                (item) => item.cartId === cartId
            );

            const cartItemEl = this.cartElItems.find(
                (cartEl) => cartEl.item.cartId === cartId
            );

            // Remove from cart if remove btn clicked
            const removeButton = e.target.closest(".remove-btn");
            if (removeButton) {
                this.removeFromCart(itemObject, cartItemEl);
                return;
            }

            const itemPriceInput = cartItem.querySelector("#price");
            let itemPrice = parseFloat(itemPriceInput.value) || 0;

            const decrementButton = e.target.closest(".price-decrement");
            const incrementButton = e.target.closest(".price-increment");

            if (decrementButton && itemPrice > 0.99) {
                itemPrice--;
                itemPriceInput.value = itemPrice.toFixed(2);
                itemPriceInput.setAttribute("data-prev", itemPrice);
            }

            if (incrementButton && itemPrice <= 998.99) {
                itemPrice++;
                itemPriceInput.value = itemPrice.toFixed(2);
                itemPriceInput.setAttribute("data-prev", itemPrice);
            }

            itemObject.currentPrice = itemPrice;

            itemObject.recalc();
            cartItemEl.recalc();
            this.updateTotalsUI();
        });

        // Cart item price input regex
        cartItems.addEventListener("input", (e) => {
            const input = e.target;

            const cartItem = e.target.closest(".cart-item");
            if (!cartItem) return;

            const cartId = Number(cartItem.getAttribute("data-cart-id"));

            const itemObject = this.items.find(
                (item) => item.cartId === cartId
            );

            const cartItemEl = this.cartElItems.find(
                (cartEl) => cartEl.item.cartId === cartId
            );

            if (input.id === "price") {
                let value = input.value;

                const previousValue = input.getAttribute("data-prev") || "";

                // Regex to validate valid price formats
                const validRegex = /^(?!0\d)\d{0,3}(\.\d{0,2})?$/;

                if (!validRegex.test(value) || parseFloat(value) > 999.99) {
                    input.value = previousValue;
                    return;
                }

                // Save the current valid value as the new "previous"
                input.setAttribute("data-prev", value);
                itemObject.currentPrice = parseFloat(value) || 0;
            }

            if (input.name.slice(0, 7) === "factory") {
                const factoryId = input.getAttribute("id");
                itemObject.selectedFactoryId = factoryId;
            }

            itemObject.recalc();
            cartItemEl.recalc();
            this.updateTotalsUI();
        });

        cartDiscountBtnContainer.addEventListener("click", (e) => {
            const discountBtn = e.target.closest(".discount-btn");
            if (!discountBtn) return;

            const discount = parseFloat(discountBtn.textContent.slice(1)) / 100;

            if (discountBtn.classList.contains("selected")) {
                discountBtn.classList.remove("selected");
                this.removeDiscount();
            } else {
                cartDiscountBtns.forEach((btn) =>
                    btn.classList.remove("selected")
                );
                discountBtn.classList.add("selected");
                this.setDiscount(discount);
            }
        });

        copyTextBtn.addEventListener("click", async () => {
            if (!copyTextBtn.classList.contains("expanded")) {
                overlay.classList.add("show");
                copyTextBtn.classList.add("expanded");
                copyIcon.src = "images/x.svg";
                copyTextBtn.querySelector("p").textContent = "Close";
                copyDropdown.classList.add("show");
            } else {
                closeCopyMenu();
            }
        });

        overlay.addEventListener("click", () => {
            closeCopyMenu();
        });

        copyBusinessBtn.addEventListener("click", async () => {
            await this.copyBusinessQuote();
            this.showFeedbackMessage("Quote Copied");
            closeCopyMenu();
        });

        copyCustomerBtn.addEventListener("click", async () => {
            await this.copyCustomerQuote();
            this.showFeedbackMessage("Quote Copied");
            closeCopyMenu();
        });

        function closeCopyMenu() {
            copyTextBtn.classList.remove("expanded");
            copyIcon.src = "images/dropdown-arrow2.svg";
            copyTextBtn.querySelector("p").textContent = "Copy";
            copyDropdown.classList.remove("show");
            overlay.classList.remove("show");
        }
    }

    async copyBusinessQuote() {
        const copy = this.generateBusinessQuote();
        try {
            await navigator.clipboard.writeText(copy);
            console.log("Internal quote copied!");
        } catch (err) {
            console.error("Failed to copy business quote:", err);
        }
    }

    async copyCustomerQuote() {
        const copy = this.generateCustomerQuote();
        try {
            await navigator.clipboard.writeText(copy);
            console.log("Customer quote copied!");
        } catch (err) {
            console.error("Failed to copy customer quote:", err);
        }
    }

    generateBusinessQuote() {
        // 1) Header
        let output = "Customer Quote\n\n";

        // 2) Total Price & Profit Margin
        if (this.discountPercent != 0) {
            output += `Discount: ${this.discountPercent * 100}%\n`;
            output += `Discounted Price: `;
        } else {
            output += `Total Price: `;
        }
        output += `$${this.totalPrice.toFixed(2)}\n`;
        output += `Total Profit Margin: ${this.totalProfitMargin.toFixed(
            2
        )}%\n\n`;

        // 3) List each product
        this.items.forEach((item, index) => {
            // item is a CustomProduct
            // Name of the product
            output += `${item.name}\n`;

            // Price & margin for this product
            const itemPrice = item.currentPrice.toFixed(2);
            const itemMargin = this.cartElItems
                .at(index)
                .profitMargin.toFixed(2);

            output += `Price: $${itemPrice}\n`;
            output += `Profit Margin: ${itemMargin}%\n`;

            // Factory (only if multiple factories exist)
            if (item.product.factories.length > 1) {
                // Find the factory object so we can get its name
                const factoryObj = item.product.factories.find(
                    (f) => f.id === item.selectedFactoryId
                );
                if (factoryObj) {
                    output += `Factory: ${factoryObj.name}\n`;
                }
            }

            // List selected options
            if (item.product.options.length > 0) {
                output += "Styles:\n";

                for (const [optionId, choiceValue] of Object.entries(
                    item.selectedOptions
                )) {
                    // Find the Option by ID
                    const optionObj = item.product.options.find(
                        (opt) => opt.id === optionId
                    );
                    if (!optionObj) continue;

                    // The option name
                    const optionName = optionObj.name || optionObj.id;

                    // choiceValue could be a single ID or an array
                    if (Array.isArray(choiceValue)) {
                        // multiple-choice
                        output += `• ${optionName}: \n`;
                        choiceValue.forEach((choiceId) => {
                            const choiceObj = optionObj.choices.find(
                                (c) => c.id === choiceId
                            );
                            if (choiceObj) {
                                output += `\t• ${choiceObj.label}\n`;
                            }
                        });
                    } else {
                        // single-choice or boolean
                        const choiceObj = optionObj.choices
                            ? optionObj.choices.find(
                                  (c) => c.id === choiceValue
                              )
                            : null;
                        if (choiceObj) {
                            output += `• ${optionName}: ${choiceObj.label}\n`;
                        } else {
                            // if it's a boolean with no .choices array (rare?), adapt as needed
                        }
                    }
                }
            }

            // 4) Blank line between products (but not after the last, if you prefer)
            if (index < this.items.length - 1) {
                output += "\n"; // extra line for readability
            }
        });

        return output;
    }

    generateCustomerQuote() {
        // 1) Header
        let output = "Your Quote Breakdown:\n\n";

        // 2) List each product
        this.items.forEach((item, index) => {
            // For each product: "Name ($99.99)"
            output += `${item.name} ($${item.currentPrice.toFixed(2)})\n`;

            // Then bullet points of each chosen choice label
            // (No need for option names, just the choice labels)
            if (item.product && item.product.options) {
                for (const [optionId, choiceValue] of Object.entries(
                    item.selectedOptions
                )) {
                    // Find the Option
                    const optionObj = item.product.options.find(
                        (opt) => opt.id === optionId
                    );
                    if (!optionObj) continue;

                    // For each choice, bullet the choice LABEL only
                    if (Array.isArray(choiceValue)) {
                        choiceValue.forEach((choiceId) => {
                            const choiceObj = optionObj.choices.find(
                                (c) => c.id === choiceId
                            );
                            if (choiceObj) {
                                output += `• ${choiceObj.label}${
                                    optionId === "embroidery"
                                        ? " Embroidery"
                                        : ""
                                }\n`;
                            }
                        });
                    } else {
                        const choiceObj = optionObj.choices
                            ? optionObj.choices.find(
                                  (c) => c.id === choiceValue
                              )
                            : null;
                        if (choiceObj) {
                            output += `• ${choiceObj.label}\n`;
                        }
                    }
                }
            }

            // Blank line between each product
            if (index < this.items.length - 1) {
                output += "\n";
            }
        });

        // 3) After all items, a blank line, then "Total Package Price"
        //    then another line with the final cart total
        output += "\nTotal Package Price:\n";
        output += `$${this.totalPrice.toFixed(2)}\n`;

        return output;
    }
}

class App {
    categories = [];
    products = [];
    cart;
    mediaQuery = window.matchMedia("(min-width: 768px)");

    constructor(data) {
        data.categories.forEach((cat) => {
            const category = new Category(cat);
            this.categories.push(category);
        });

        data.products.forEach((prod) => {
            const product = new Product(prod);
            this.products.push(product);
        });

        this.cart = new Cart(data.floorProfitMargin, data.highProfitMargin);

        this.setCategoriesUI();
        this.attachListeners();
    }

    // Creates category buttons in UI
    setCategoriesUI() {
        this.categories.forEach((category) => {
            const html = `<div class="option-selection btn-main">
                        <input type="radio" name="category" id="${category.id}" />
                        <label for="${category.id}">${category.name}</label>
                    </div>`;

            categoryBtns.insertAdjacentHTML("beforeend", html);
        });

        // Handle category selection
        categoryBtns.addEventListener("click", (e) => {
            const categoryBtn = e.target.closest(".option-selection");
            if (!categoryBtn) return;

            const categoryBtnInput = categoryBtn.querySelector("input");
            const category = this.categories.find(
                (cat) => cat.id === categoryBtnInput.id
            );

            productsListLabel.style.color = "white";
            this.setProductListUI(category);
        });
    }

    setProductListUI(category) {
        // Reset product list UI
        productList.innerHTML = "";

        // Add packages
        category.packages.forEach((pack) => {
            const items = [];
            // Add each item to list as CustomProduct
            pack.items.forEach((item) => {
                const product = this.products.find(
                    (pro) => pro.id === item.productId
                );

                // Add copyIndex to mark quantity value
                for (let i = 0; i < item.quantity; i++) {
                    const customProduct = new CustomProduct(
                        product,
                        this.cart.addToCart
                    );
                    customProduct.copyIndex = i + 1;
                    items.push(customProduct);
                }
            });
            const customPackage = new CustomPackage(pack, items);
            new PackageUIState(customPackage);
        });

        // Add standalone products
        category.productIds.forEach((productId) => {
            const product = this.products.find((pro) => pro.id === productId);
            const customProduct = new CustomProduct(
                product,
                this.cart.addToCart
            );
            new ProductUIState(customProduct);
        });
    }

    attachListeners() {
        // Product item dropdowns
        productList.addEventListener("click", function (e) {
            const productHeader = e.target.closest(".product-header");
            if (!productHeader) return;

            const productItem = productHeader.closest(".product-item");
            const productOptions =
                productItem.querySelector(".product-options");

            // Open/Close toggle
            if (productItem.classList.contains("open")) {
                // Close
                productOptions.style.maxHeight = 0;
                productOptions.style.marginBottom = 0;
                productItem.classList.remove("open");
            } else {
                const openItem =
                    productList.querySelector(".product-item.open");

                if (openItem) {
                    const openOptions =
                        openItem.querySelector(".product-options");
                    openOptions.style.maxHeight = 0;
                    openOptions.style.marginBottom = 0;
                    openItem.classList.remove("open");
                }

                // Open
                productItem.classList.add("open");
                const fullHeight = productOptions.scrollHeight;
                productOptions.style.maxHeight = fullHeight + "px";
                productOptions.style.marginBottom = 12 + "px";
                productOptions.addEventListener(
                    "transitionend",
                    function (e) {
                        if (e.propertyName === "max-height") {
                            productHeader.scrollIntoView({
                                behavior: "auto",
                                block: "nearest",
                            });
                        }
                    },
                    { once: true }
                );
            }
        });

        // Cart toggle
        cartToggle.addEventListener("click", () => {
            cartPanel.classList.toggle("open");
            copyContainer.classList.toggle("open");
            cartToggle.classList.toggle("open");
            document.body.classList.toggle("cart-open");
        });

        const handleCopyScreenSize = () => {
            if (this.mediaQuery.matches) {
                copyContainer.classList.add("open");
            } else {
                copyContainer.classList.remove("open");
            }
        };
        handleCopyScreenSize();
        this.mediaQuery.addEventListener("change", handleCopyScreenSize);
    }
}

const readData = async function (file) {
    const res = await fetch(file);
    const data = await res.json();
    return data;
};

(async () => {
    try {
        const data = await readData("product-data.json");
        new App(data);
    } catch (err) {
        console.error(err);
    }
})();
