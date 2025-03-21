import React from "react";

const Footer = () => {
    return (
        <footer className="bg-white px-8 w-full">
            <div className="max-w-7xl mx-auto px-8 sm:px-6 lg:px-8">
                <div className="text-sm flex items-center justify-between h-16 text-slate-700">
                    <div className="copyrightInfo">
                        <p>&copy; 2025 Nazwa Firmy. Wszystkie prawa zastrzeżone.</p>
                    </div>
                    <div className="flex flex-row gap-8">
                        <p>Polityka prywatności</p>
                        <p>Warunki użytkowania</p>
                        <p>Kontakt</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer;