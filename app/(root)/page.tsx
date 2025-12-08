"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiFetch, healthCheck } from "../lib/api";
import { setToken, setTokens } from "../lib/auth";
import { FaFacebook, FaGoogle, FaInstagram } from "react-icons/fa";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { SiPhotopea } from "react-icons/si";
import { IoChevronDown } from "react-icons/io5";
import Link from "next/link";

export default function Home() {
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [healthInfo, setHealthInfo] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (codeSent) {
      codeInputRef.current?.focus();
    }
  }, [codeSent]);
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-row items-center w-2/3 h-3/4 bg-white">
        <div className="bg-slate-700 w-1/2 h-full">
          <div className="flex flex-col justify-between p-10 text-slate-50 h-full">
            <div className="flex flex-col items-center justify-center">
              <h1 className="flex flex-row items-center gap-2 text-2xl font w-1/1">
                <SiPhotopea className="text-2xl mr-2" />
                <span>Nazwa firmy</span>
              </h1>
              <div className="w-1/2 h-0.5 bg-slate-600 my-8"></div>
              <p className="w-full font-bold text-3xl">Złap swoje momenty!</p>
              <p className="w-full font-bold text-slate-400 my-2 mb-16">Profesjonalne usługi fotograficzne pod twoją ręką! Nie zwklekaj i utrwal swoje wspomnienia na zawsze!</p>
              <div className="flex flex-col w-full gap-4">
                <div className="flex flex-row w-full items-center gap-4">
                  <IoIosCheckmarkCircle className="text-xl" /><span className="font-bold ">Przeglądaj albumy</span>
                </div>
                <div className="flex flex-row w-full items-center gap-4">
                  <IoIosCheckmarkCircle className="text-xl" /><span className="font-bold ">Wybierz i kup wybrane zdjęcia</span>
                </div>
                <div className="flex flex-row w-full items-center gap-4">
                  <IoIosCheckmarkCircle className="text-xl" /><span className="font-bold ">Udostępnij album najbliższym</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-700 w-1/2 h-full flex flex-col justify-end items-center">
              <div className="flex flex-row w-full items-start gap-4">
                <FaFacebook className="text-slate-400 text-2xl" />
                <FaInstagram className="text-slate-400 text-2xl" />
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/2 h-full flex flex-col justify-center items-center relative">
          <div className="w-3/5 h-2/3 flex flex-col justify-center items-center">
            <p className="text-slate-700 font-bold text-2xl text-center">Jeszcze jeden krok!</p>
            <p className="text-slate-600 text-sm text-center mb-6">Wybierz dowolną opcję logowania i przeglądaj swoje zdjęcia</p>
            <div className="EmailWrapper flex flex-col w-full items-center">
              <p className="text-slate-700 text-sm w-full mb-1">Wpisz adres e-mail</p>
              <div className="emailInputWrapper flex flex-row w-full items-center">
                <input
                  type="email"
                  placeholder="twoj@adres.pl"
                  value={email}
                  disabled={codeSent}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!email || !email.includes("@")) {
                        setEmailError("Proszę podać poprawny adres e-mail");
                        return;
                      }
                      (async () => {
                        try {
                          const r = await apiFetch('/api/auth/request_code/', ({
                            method: 'POST',
                            body: JSON.stringify({ email }),
                            skipAuth: true,
                          } as any));
                          const data = await r.json().catch(() => ({}));
                          if (!r.ok) {
                            setEmailError(data?.detail || 'Ten adres e-mail nie jest przypisany. Skontaktuj się z fotografem.');
                            return;
                          }
                          setCodeSent(true);
                          setEmailError("");
                          localStorage.setItem('auth_email', email);
                        } catch (err) {
                          setEmailError('Nie udało się wysłać kodu');
                        }
                      })();
                    }
                  }}
                  className={`w-full h-10 rounded-md border-2 ${emailError ? 'border-red-500 focus:ring-red-400 focus:border-red-500' : 'border-slate-300 focus:ring-slate-400 focus:border-slate-500'} p-2 focus:ring-1 focus:outline-none ${codeSent ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                />
              </div>
              {emailError && <p className="text-red-500 text-sm mt-1 w-full">{emailError}</p>}
              {!codeSent ? (
                <button
                  onClick={async () => {
                    if (!email || !email.includes("@")) {
                      setEmailError("Proszę podać poprawny adres e-mail");
                      return;
                    }
                    try {
                      const r = await apiFetch('/api/auth/request_code/', ({
                        method: 'POST',
                        body: JSON.stringify({ email }),
                        skipAuth: true,
                      } as any));
                      const data = await r.json().catch(() => ({}));
                      if (!r.ok) {
                        setEmailError(data?.detail || 'Ten adres e-mail nie jest przypisany. Skontaktuj się z fotografem.');
                        return;
                      }
                      setCodeSent(true);
                      setEmailError("");
                      localStorage.setItem('auth_email', email);
                    } catch (err) {
                      setEmailError('Nie udało się wysłać kodu');
                    }
                  }}
                  className="w-full h-10 rounded-md bg-slate-700 text-slate-50 border border-slate-50 mt-4"
                >
                  Wyślij kod
                </button>
              ) : (
                <div className="w-full mt-2">
                  <label className="block text-slate-700 text-sm mb-1">Wpisz kod z e-maila</label>
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          (async () => {
                            const em = localStorage.getItem('auth_email') || email;
                            try {
                              const r = await apiFetch('/api/auth/verify_code/', ({
                                method: 'POST',
                                body: JSON.stringify({ email: em, code }),
                                skipAuth: true,
                              } as any));
                              const data = await r.json();
                              if (r.ok && data.access) {
                                if (data.refresh) setTokens(data.access, data.refresh);
                                else setToken(data.access);
                                window.location.href = '/albums';
                              } else {
                                setCodeError(data.detail || 'Niepoprawny kod');
                              }
                            } catch (err) {
                              setCodeError('Weryfikacja nie powiodła się');
                            }
                          })();
                        }
                      }}
                      ref={codeInputRef}
                      className={`flex-1 h-10 rounded-md border-2 ${codeError ? 'border-red-500 focus:ring-red-400 focus:border-red-500' : 'border-slate-300 focus:ring-slate-400 focus:border-slate-500'} p-2 focus:ring-1 focus:outline-none`}
                      placeholder="123456"
                    />
                    <button
                      onClick={async () => {
                        const e = localStorage.getItem('auth_email') || email;
                        try {
                          const r = await apiFetch('/api/auth/verify_code/', ({
                            method: 'POST',
                            body: JSON.stringify({ email: e, code }),
                            skipAuth: true,
                          } as any));
                          const data = await r.json();
                          if (r.ok && data.access) {
                            if (data.refresh) setTokens(data.access, data.refresh);
                            else setToken(data.access);
                            window.location.href = '/albums';
                          } else {
                            setCodeError(data.detail || 'Niepoprawny kod');
                          }
                        } catch (err) {
                          setCodeError('Weryfikacja nie powiodła się');
                        }
                      }}
                      className="h-10 px-4 rounded-md bg-slate-700 text-white"
                    >
                      Potwierdź
                    </button>
                  </div>
                  {codeError && <p className="text-red-500 text-sm mt-1 w-full">{codeError}</p>}
                </div>
              )}
            </div>
          </div>
            <div className="absolute bottom-16 left-4">
            <button
              onClick={async () => {
                try {
                  const data = await healthCheck();
                  setHealthInfo(`Status: ${data.status}`);
                } catch (err) {
                  setHealthInfo('Błąd podczas sprawdzania statusu serwera');
                }
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm"
            >
              Sprawdź status serwera
            </button>
            {healthInfo && <p className="text-slate-600 text-sm mt-2">{healthInfo}</p>}
          </div>
          <div className="helpButton absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
            <span className="text-slate-400 text-sm">Potrzebujesz pomocy? Chciałbyś poprosić o dostęp?</span>
            <button className="ml-2 text-slate-700 underline text-sm">Kontakt</button>
          </div>
        </div>
      </div>
    </div>
  );
}
